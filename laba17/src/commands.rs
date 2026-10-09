use chrono::Local;
use std::process;

pub fn greet(name: &str) {
    println!(
        "Привет, {}! Добро пожаловать в ClI-приложение группы 478.",
        name
    );
    process::exit(0);
}

pub fn info() {
    println!("Группа: 478");
    println!("Студент: Дема Илья");
    println!("Лабораторная работа: №17");
    println!("Дата: {}", today());
    process::exit(0);
}

fn today() -> String {
    Local::now().format("%Y-%m-%d").to_string()
}
