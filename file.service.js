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
    }

    async renameFileAsync(tmp,path) {

        if(await this.existsFileAsync(path))
        {
            await this.unlinkFileAsync(path);
        }

        return await this._renameFileAsync(tmp,path);
    }

    async writeFileAsync(path,data,createDir) {
        if(createDir)
        {
            var parentDir = ppath.dirname(path);
            if(!await this.existsFileAsync(parentDir))
            {
                fs.mkdirSync(parentDir, { recursive: true });        
            }
        }

        return this._writeFileAsync(path,data);   
    }

    writeFile(path,data,createDir) {
        if(createDir)
        {
            var parentDir = ppath.dirname(path);
            fs.exists(parentDir,exists=>{
                fs.mkdirSync(parentDir, { recursive: true });        
            });
        }

        return fs.writeFileSync(path,data);   
    }

}

module.exports = new FSService();