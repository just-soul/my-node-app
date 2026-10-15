use colored::*;
use console::Term;
use indicatif::{ProgressBar, ProgressStyle};
use std::process;
use std::thread;
use std::time::Duration;

fn main() {
    let args: Vec<String> = std::env::args().collect();

    if args.len() < 2 {
        eprintln!("Использование: task4 <process|progress|error>");
        process::exit(1);
    }

    let is_tty = Term::stdout().is_term();

    match args[1].as_str() {
        "process" => run_process(is_tty),
        "progress" => run_progress(is_tty),
        "error" => run_error(is_tty),
        other => {
            eprintln!("Неизвестная команда: {}", other);
            process::exit(1);
        }
    }
}

fn run_process(is_tty: bool) {
    if is_tty {
        println!("{}", "Файлы найдены (3 шт.)".green());
        println!("{}", "Обработка завершена".green());
        println!("{}", "Результат сохранён: output.json".blue());
    } else {
        println!("output.json");
    }
}

fn run_progress(is_tty: bool) {
    if !is_tty {
        println!("processed 10 files");
        return;
    }

    let total = 10;
    let pb = ProgressBar::new(total);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{bar:40.cyan/blue}] {pos}/{len} ETA: {eta}")
            .unwrap()
            .progress_chars("█▓░"),
    );

    for _ in 0..total {
        thread::sleep(Duration::from_millis(200));
        pb.inc(1);
    }

    pb.finish_with_message("готово");
}

fn run_error(is_tty: bool) {
    if is_tty {
        eprintln!("{}", "Файл a.txt обработан".green());
        eprintln!("{}", "Файл missing.txt не найден".red());
        eprintln!("{}", "Пропущено 1 файл".yellow());
    } else {
        eprintln!("warning: missing.txt not found");
    }
    process::exit(1);
}
