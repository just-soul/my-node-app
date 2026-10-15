use clap::{Parser, Subcommand, ValueEnum};
use std::process;

/// CLI-приложение для лабораторной работы №17
#[derive(Parser)]
#[command(name = "my-cli")]
#[command(version = "1.0.0")]
struct Cli {
    /// Подробный вывод
    #[arg(short, long, global = true)]
    verbose: bool,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Сгенерировать отчёт
    Generate {
        /// Тип отчёта
        #[arg(short = 't', long = "type", value_enum, default_value_t = ReportType::Html)]
        report_type: ReportType,

        /// Путь для сохранения
        #[arg(short, long, default_value = "output")]
        output: String,

        /// Перезаписать существующий файл
        #[arg(short, long)]
        force: bool,

        /// Показать, что будет сделано, без выполнения
        #[arg(long)]
        dry_run: bool,
    },

    /// Конвертировать файл
    Convert {
        /// Входной файл
        #[arg(short, long)]
        input: String,

        /// Выходной файл
        #[arg(short, long)]
        output: String,
    },
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, PartialOrd, Ord, ValueEnum)]
enum ReportType {
    Html,
    Pdf,
    Json,
    Csv,
}

fn main() {
    let cli = Cli::parse();

    match &cli.command {
        Some(Commands::Generate {
            report_type,
            output,
            force,
            dry_run,
        }) => {
            if cli.verbose {
                println!("[VERBOSE] Запуск генерации отчёта...");
                println!("[VERBOSE] Тип отчёта: {:?}", report_type);
                println!("[VERBOSE] Путь сохранения: {}", output);
            }

            if *dry_run {
                println!("[DRY-RUN] Будет сгенерирован отчёт типа: {:?}", report_type);
                println!(
                    "[DRY-RUN] Файл будет сохранён в: {}.{}",
                    output,
                    ext(report_type)
                );
                println!("[DRY-RUN] Действия не выполнены (режим проверки)");
                process::exit(0);
            }

            if *force {
                println!("Перезапись разрешена");
            }

            println!(
                "Отчёт успешно сгенерирован: {}.{}",
                output,
                ext(report_type)
            );
            process::exit(0);
        }

        Some(Commands::Convert { input, output }) => {
            if cli.verbose {
                println!("[VERBOSE] Конвертация: {} -> {}", input, output);
            }
            println!("Файл сконвертирован: {} -> {}", input, output);
            process::exit(0);
        }

        None => {
            println!("Используйте --help для справки");
            process::exit(1);
        }
    }
}

fn ext(t: &ReportType) -> &'static str {
    match t {
        ReportType::Html => "html",
        ReportType::Pdf => "pdf",
        ReportType::Json => "json",
        ReportType::Csv => "csv",
    }
}
