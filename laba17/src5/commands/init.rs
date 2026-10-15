use crate::services;
use crate::utils;

pub fn run(args: &[String]) -> Result<(), String> {
    let name = utils::get_option(args, "--name").unwrap_or_else(|| "my-app".into());
    let project_type = utils::get_option(args, "--type").unwrap_or_else(|| "cli".into());

    if utils::has_flag(args, "--dry-run") {
        println!("[DRY-RUN] Будет создан проект \"{}\" типа {}", name, project_type);
        return Ok(());
    }

    services::do_init(&name, &project_type)
}
