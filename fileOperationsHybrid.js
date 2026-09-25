const fs = require('fs');
const path = require('path');

class FileManager {
    constructor(baseDir = './data') {
        this.baseDir = baseDir;

        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
            console.log(`Создана директория: ${this.baseDir}`);
        }
    }

    createFile(filename, content, callback) {
        const filePath = path.join(this.baseDir, filename);

        const promise = fs.promises.writeFile(filePath, content, 'utf8')
            .then(() => filePath);

        if (callback) {
            promise
                .then(filePath => callback(null, filePath))
                .catch(error => callback(error, null));

            return;
        }

        return promise;
    }

    readFile(filename, callback) {
        const filePath = path.join(this.baseDir, filename);

        const promise = fs.promises.readFile(filePath, 'utf8');

        if (callback) {
            promise
                .then(data => callback(null, data))
                .catch(error => callback(error, null));

            return;
        }

        return promise;
    }

    getFileStats(filename, callback) {
        const filePath = path.join(this.baseDir, filename);

        const promise = fs.promises.stat(filePath)
            .then(stats => {
                return {
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime,
                    isFile: stats.isFile()
                };
            });

        if (callback) {
            promise
                .then(stats => callback(null, stats))
                .catch(error => callback(error, null));

            return;
        }

        return promise;
    }

    deleteFile(filename, callback) {
        const filePath = path.join(this.baseDir, filename);

        const promise = fs.promises.unlink(filePath);

        if (callback) {
            promise
                .then(() => callback(null))
                .catch(error => callback(error));

            return;
        }

        return promise;
    }

    listFiles(callback) {
        const promise = fs.promises.readdir(this.baseDir)
            .then(async files => {
                const result = [];

                for (const file of files) {
                    const filePath = path.join(this.baseDir, file);
                    const stats = await fs.promises.stat(filePath);

                    if (stats.isFile()) {
                        result.push(file);
                    }
                }

                return result;
            });

        if (callback) {
            promise
                .then(files => callback(null, files))
                .catch(error => callback(error, null));

            return;
        }

        return promise;
    }

    async safeCreateAndRead(filename, content) {
        try {
            await this.createFile(filename, content);
            const data = await this.readFile(filename);

            return data;
        } catch (error) {
            console.log('Произошла ошибка:', error.message);
            throw error;
        }
    }
}

module.exports = FileManager;
