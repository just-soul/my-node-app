mod commands;
mod services;
mod utils;

use std::env;
use std::panic;
use std::process;

fn main() {
    panic::set_hook(Box::new(|info| {
        let msg = info
            .payload()
            .downcast_ref::<&str>()
            .unwrap_or(&"неизвестная ошибка");
        eprintln!("Ошибка: {}", msg);
    }));

    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        utils::print_help();
        process::exit(1);
    }

    let result = match args[1].as_str() {
        "init" => commands::init::run(&args[2..]),
        "build" => commands::build::run(&args[2..]),
        "test" => commands::test::run(&args[2..]),
        "deploy" => commands::deploy::run(&args[2..]),
        "help" | "--help" | "-h" => {
            utils::print_help();
            Ok(())
        }
        other => {
            eprintln!("Неизвестная команда: {}", other);
            process::exit(1);
        }
    };

    if let Err(e) = result {
        eprintln!("Ошибка: {}", e);
        process::exit(1);
    }
}
