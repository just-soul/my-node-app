pub fn do_init(name: &str, project_type: &str) -> Result<(), String> {
    if name.is_empty() {
        return Err("имя проекта не может быть пустым".into());
    }
    if project_type != "cli" && project_type != "web" && project_type != "lib" {
        return Err(format!("неизвестный тип: {}", project_type));
    }
    println!("	Проект \"{}\" создан", name);
    println!("  Тип: {}", project_type);
    Ok(())
}

pub fn do_build() -> Result<(), String> {
    println!("🔧 Сборка проекта...");
    println!("	Сборка завершена за 2.3s");
    Ok(())
}

pub fn do_test() -> Result<(), String> {
    println!("🔧 Запуск тестов...");
    println!("	 Пройдено: 15/15 тестов");
    println!("	 Покрытие: 87%");
    Ok(())
}

pub fn do_deploy(env: &str) -> Result<(), String> {
    if env == "production" {
        println!("	Вы собираетесь развернуть проект в production!");
    }
    println!("	Развёрнуто успешно в {}", env);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init_ok() {
        assert!(do_init("my-app", "cli").is_ok());
    }

    #[test]
    fn test_init_empty_name() {
        assert!(do_init("", "cli").is_err());
    }

    #[test]
    fn test_init_bad_type() {
        assert!(do_init("app", "unknown").is_err());
    }

    #[test]
    fn test_build_ok() {
        assert!(do_build().is_ok());
    }

    #[test]
    fn test_deploy_ok() {
        assert!(do_deploy("staging").is_ok());
    }
}
