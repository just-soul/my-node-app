use crate::services;
use crate::utils;

pub fn run(args: &[String]) -> Result<(), String> {
    let env = utils::get_option(args, "--env").unwrap_or_else(|| "staging".into());

    if env == "production" && !utils::has_flag(args, "--force") {
        eprintln!("	 Для production нужен флаг --force");
        return Err("развёртывание отменено".into());
    }

    services::do_deploy(&env)
}
