use chrono::Local;
use std::fs::OpenOptions;
use std::io::Write;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;
use sysinfo::System;

pub fn run() {
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();

    ctrlc::set_handler(move || {
        r.store(false, Ordering::SeqCst);
    })
    .expect("не удалось установить обработчик Ctrl+C");

    let mut sys = System::new_all();
    sys.refresh_all();
    println!("      Первичный сбор данных ");
    println!("Группа: 478");
    println!("Платформа: {}", std::env::consts::OS);
    println!(
        "Хост: {}",
        System::host_name().unwrap_or_else(|| "неизвестно".into())
    );
    println!("Ядер CPU: {}", sys.cpus().len());
    println!("Память: {:.2} ГБ", to_gb(sys.total_memory()));
    println!("Время работы: {} сек", System::uptime());
    println!();

    println!("Мониторинг (группа 478). Ctrl+C для выхода.");
    println!();

    let mut warnings = 0;
    let log_path = "monitor.log";

    while running.load(Ordering::SeqCst) {
        sys.refresh_cpu_usage();
        thread::sleep(Duration::from_millis(500));
        sys.refresh_cpu_usage();

        let cpu = sys.global_cpu_usage();
        sys.refresh_memory();

        let total = sys.total_memory();
        let free = read_available_memory().unwrap_or_else(|| sys.free_memory());
        let used_pct = ((total - free) as f64 / total as f64) * 100.0;
        let free_gb = to_gb(free);

        let mut status = format!(
            "CPU: {:.1}% | RAM: {:.1}% ({:.2} ГБ свободно)",
            cpu, used_pct, free_gb
        );

        if cpu > 80.0 {
            status = format!("⚠⚠ {}", status);
            log_warning(log_path, &format!("CPU {:.1}% (критично)", cpu));
            warnings += 1;
        } else if cpu > 50.0 {
            status = format!("⚠ {}", status);
            log_warning(log_path, &format!("CPU {:.1}% (предупреждение)", cpu));
            warnings += 1;
        }

        if (free as f64 / total as f64) < 0.1 {
            status = format!("⚠ {}", status);
            log_warning(
                log_path,
                &format!("Мало памяти: {:.2} ГБ свободно", free_gb),
            );
            warnings += 1;
        }

        print!("\r{}        ", status);
        std::io::stdout().flush().ok();

        thread::sleep(Duration::from_millis(1500));
    }

    println!();
    println!();
    println!("Мониторинг остановлен. Предупреждений: {}", warnings);
}

fn to_gb(bytes: u64) -> f64 {
    bytes as f64 / 1024.0 / 1024.0 / 1024.0
}

fn read_available_memory() -> Option<u64> {
    let content = std::fs::read_to_string("/proc/meminfo").ok()?;
    for line in content.lines() {
        if line.starts_with("MemAvailable:") {
            let kb: u64 = line.split_whitespace().nth(1)?.parse().ok()?;
            return Some(kb * 1024);
        }
    }
    None
}

fn log_warning(path: &str, msg: &str) {
    let time = Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    let line = format!("[{}] [478] Предупреждение: {}\n", time, msg);

    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(path) {
        let _ = file.write_all(line.as_bytes());
    }
}
