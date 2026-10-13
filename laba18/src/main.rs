mod monitor;
mod network;
mod resources;
mod system_info;

use std::{env, process};

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Использование: <system|resources|network|monitor>");
        process::exit(1);
    }

    match args[1].as_str() {
        "system" => system_info::run(),
        "resources" => resources::run(),
        "network" => network::run(),
        "monitor" => monitor::run(),
        other => {
            eprintln!("Неизвестная команда: {}", other);
            process::exit(1);
        }
    }
}
