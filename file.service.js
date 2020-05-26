const fs = require('fs');
const { promisify } = require('util')
var ppath = require('path');

class FSService 
{
    constructor() {
        this.readFileAsync = promisify(fs.readFile);
        this._writeFileAsync = promisify(fs.writeFile);
        this._renameFileAsync = promisify(fs.rename);
        this.existsFileAsync = promisify(fs.exists);
        this.unlinkFileAsync = promisify(fs.unlink);
        this.existsSync = fs.existsSync;
        this.statAsync = promisify(fs.stat);
    }

    async createParentDirAsync(fpath) {
        var parentDir = ppath.dirname(fpath);
        return await this.createDirAsync(parentDir);
    }

    cleanPath(path) {
        return path.replace(/[/\\]+/g,'/');
    }

    basename(path) {
        return ppath.basename(path);
    }
    async createDirAsync(dir)
    {
        if(!await this.existsFileAsync(dir))
        {
            fs.mkdirSync(dir, { recursive: true });        
        }
        return dir;
    }

    readdir(path,cb) {
        return fs.readdir(path,cb);
    }

    async renameFileAsync(tmp,path,createDir) {

        if(await this.existsFileAsync(path))
        {
            await this.unlinkFileAsync(path);
        }

        if(createDir)
        {
            var parentDir = ppath.dirname(path);
            await this.createDirAsync(dir);
        }

        return await this._renameFileAsync(tmp,path);
    }

    async writeFileAsync(path,data,createDir) {
        if(createDir)
        {
            var parentDir = ppath.dirname(path);
            await this.createDirAsync(parentDir);
        }

        return this._writeFileAsync(path,data);   
    }

    writeFile(path,data,createDir) {
        if(createDir)
        {
            var parentDir = ppath.dirname(path);
            !fs.exists(parentDir,exists=>{
                fs.mkdirSync(parentDir, { recursive: true });        
            });
        }

        return fs.writeFileSync(path,data);   
    }

}

module.exports = new FSService();