use std::{env, process};

mod commands;
mod help;

use commands::{greet, info};
use help::print_help;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        print_help();
        process::exit(1);
    }

    let command = args[1].as_str();

    match command {
        "greet" => {
            let name = args.get(2).map(|s| s.as_str()).unwrap_or("гость");
            greet(name);
        }
        "info" => info(),
        "--help" | "-h" => {
            print_help();
            process::exit(0);
        }
        other => {
            eprintln!("Ошибка: неизвестная команда \"{}\"", other);
            eprintln!("Для справки используйте: my-cli --help");
            process::exit(1);
        }
    }
}
