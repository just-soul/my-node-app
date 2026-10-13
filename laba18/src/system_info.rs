use std::env;
use sysinfo::System;

pub fn run() {
    let mut sys = System::new_all();
    sys.refresh_all();

    let platform = env::consts::OS;
    let arch = env::consts::ARCH;
    let host = System::host_name().unwrap_or_else(|| "неизвестно".into());
    let os_name = System::name().unwrap_or_else(|| "неизвестно".into());
    let os_version = System::os_version().unwrap_or_else(|| "неизвестно".into());
    let uptime = System::uptime();

    println!("===Информация о системе (Группа 478)===");
    println!("Платформа: {}", platform);
    println!("Тип ОС: {}", os_name);
    println!("Архитектура: {}", arch);
    println!("Версия ОС: {}", os_version);
    println!("Имя хоста: {}", host);
    println!("Время работы: {}", format_uptime(uptime));
    println!();
    println!("{}", platform_message(platform));
}

fn format_uptime(secs: u64) -> String {
    let h = secs / 3600;
    let m = (secs % 3600) / 60;
    let s = secs % 60;
    format!("{} ч {} мин {} сек", h, m, s)
}
fn platform_message(platform: &str) -> &'static str {
    match platform {
        "windows" => "Вы работаете в Windows",
        "linux" => "Вы работаете в linux",
        "macos" => "Вы работаете в macOS",
        _ => "Неизвестная платформа",
    }
}
