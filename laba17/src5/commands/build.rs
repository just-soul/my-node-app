use crate::services;

pub fn run(_args: &[String]) -> Result<(), String> {
    services::do_build()
}
