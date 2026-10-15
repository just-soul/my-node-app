use std::fs;
use sysinfo::System;

pub fn run() {
    let sys = System::new_all();

    let total_mem = sys.total_memory();
    let free_mem = sys.free_memory();
    let used_mem = total_mem - free_mem;

    let total_gb = to_gb(total_mem);
    let used_gb = to_gb(used_mem);
    let free_percent = (free_mem as f64 / total_mem as f64) * 100.0;

    println!("=== Ресурсы системы (группа 478)===");
    println!();

    println!("Память:");
    println!("Всего: {:.2} ГБ", total_gb);
    println!(
        "Использовано: {:.2} ГБ ({:.1}% свободно)",
        used_gb, free_percent
    );
    println!();

    println!("Средняя загрузка:");
    match read_loadavg() {
        Some((l1, l5, l15)) => {
            println!("  1 мин:  {:.2}", l1);
            println!("  5 мин:  {:.2}", l5);
            println!("  15 мин: {:.2}", l15);
        }
        None => {
            println!("Недоступно на этой ОС");
        }
    }
    println!();

    if free_percent < 10.0 {
        println!("Мало свободной памяти!");
    } else {
        println!("Память в норме");
    }
}

fn to_gb(bytes: u64) -> f64 {
    bytes as f64 / 1024.0 / 1024.0 / 1024.0
}

fn read_loadavg() -> Option<(f64, f64, f64)> {
    let content = fs::read_to_string("/proc/loadavg").ok()?;
    let parts: Vec<&str> = content.split_whitespace().collect();

    if parts.len() < 3 {
        return None;
    }

    let l1 = parts[0].parse().ok()?;
    let l5 = parts[1].parse().ok()?;
    let l15 = parts[2].parse().ok()?;

    Some((l1, l5, l15))
}
