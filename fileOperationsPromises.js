const fs = require('fs');
const path = require('path');
const { readFile, writeFile, stat, unlink, readdir } = require('fs').promises;

class FileManagerPromises {
    constructor(baseDir = './data') {
        this.baseDir = baseDir;
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
            console.log(`Создана директория: ${baseDir}`);
        }
    }

    async createFile(filename, content) {
        const filePath = path.join(this.baseDir, filename);
        await writeFile(filePath, content, 'utf8');
        return filePath;
    }

    async readFile(filename) {
        const filePath = path.join(this.baseDir, filename);
        return await readFile(filePath, 'utf8');
    }

    async getFileStats(filename) {
        const filePath = path.join(this.baseDir, filename);
        const stats = await stat(filePath);
        return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isFile: stats.isFile()
        };
    }

    async deleteFile(filename) {
        const filePath = path.join(this.baseDir, filename);
        await unlink(filePath);
    }

    async listFiles() {
        return await readdir(this.baseDir);
    }

    async createMultipleFiles(files) {
        const promises = files.map(({ filename, content }) =>
            this.createFile(filename, content)
        );
        return await Promise.all(promises);
    }

    async readMultipleFiles(filenames) {
        const promises = filenames.map(async (filename) => {
            const content = await this.readFile(filename);
            return { [filename]: content };
        });
        const results = await Promise.all(promises);
        return Object.assign({}, ...results);
    }
}

module.exports = FileManagerPromises;
