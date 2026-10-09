use clap::Parser;
use dialoguer::{Confirm, Input, MultiSelect, Password, Select};
use std::io::IsTerminal;
use std::process;

/// CLI для интерактивной инициализации проекта
#[derive(Parser)]
#[command(name = "my-cli")]
#[command(version = "1.0.0")]
struct Cli {
    /// Название проекта (для неинтерактивного режима)
    #[arg(long)]
    name: Option<String>,

    /// Тип проекта: web, cli, lib, micro
    #[arg(long)]
    project_type: Option<String>,

    /// Добавить TypeScript
    #[arg(long)]
    typescript: bool,

    /// Добавить Prettier
    #[arg(long)]
    prettier: bool,

    /// Инициализировать Git
    #[arg(long)]
    git: bool,

    /// Отключить интерактив (для CI/CD)
    #[arg(long)]
    no_interactive: bool,
}

fn main() {
    let cli = Cli::parse();
    let stdin_is_tty = std::io::stdin().is_terminal();
    let interactive = !cli.no_interactive && stdin_is_tty;

    let name: String;
    let project_type: String;
    let mut options: Vec<String> = Vec::new();
    let use_git: bool;

    if interactive && cli.name.is_none() {
        name = Input::new()
            .with_prompt("Введите название проекта")
            .default("my-project".into())
            .interact_text()
            .unwrap();

        let types = vec!["Web-приложение", "CLI-утилита", "Библиотека", "Микросервис"];
        let type_idx = Select::new()
            .with_prompt("Выберите тип проекта")
            .items(&types)
            .default(1)
            .interact()
            .unwrap();

        project_type = match type_idx {
            0 => "web".to_string(),
            1 => "cli".to_string(),
            2 => "lib".to_string(),
            _ => "micro".to_string(),
        };

        let opts = vec!["TypeScript", "ESLint", "Prettier", "Jest"];
        let selected = MultiSelect::new()
            .with_prompt("Выберите дополнительные опции")
            .items(&opts)
            .interact()
            .unwrap();

        for i in selected {
            options.push(opts[i].to_string());
        }

        use_git = Confirm::new()
            .with_prompt("Использовать Git?")
            .default(true)
            .interact()
            .unwrap();

        let _token = Password::new()
            .with_prompt("Введите токен доступа")
            .interact()
            .unwrap();
    } else {
        if cli.name.is_none() || cli.project_type.is_none() {
            eprintln!(
                "Ошибка: в неинтерактивном режиме необходимо указать --name и --project-type"
            );
            process::exit(1);
        }

        name = cli.name.clone().unwrap();
        project_type = cli.project_type.clone().unwrap();

        if cli.typescript {
            options.push("TypeScript".to_string());
        }
        if cli.prettier {
            options.push("Prettier".to_string());
        }

        use_git = cli.git;
    }

    println!();
    println!("✔ Проект \"{}\" успешно инициализирован!", name);
    println!("Тип: {}", project_type);
    if !options.is_empty() {
        println!("Опции: {}", options.join(", "));
    }
    println!("Git: {}", if use_git { "да" } else { "нет" });
}
