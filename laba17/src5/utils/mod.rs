pub fn print_help() {
    println!("Использование: my-cli <команда>");
    println!();
    println!("Команды:");
    println!("  init    - инициализация проекта");
    println!("  build   - сборка проекта");
    println!("  test    - запуск тестов");
    println!("  deploy  - развёртывание");
    println!("  help    - эта справка");
}

pub fn has_flag(args: &[String], flag: &str) -> bool {
    args.iter().any(|a| a == flag)
}

pub fn get_option(args: &[String], name: &str) -> Option<String> {
    for (i, arg) in args.iter().enumerate() {
        if arg == name && i + 1 < args.len() {
            return Some(args[i + 1].clone());
        }
    }
    None
}
