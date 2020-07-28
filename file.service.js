const fs = require('fs');
const { promisify } = require('util')
var ppath = require('path');
const arraySce = require("@nxn/ext/array.service");

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
        this.readdirAsync = promisify(fs.readdir);
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

    readdir(path,cb) {
        return fs.readdir(path,cb);
    }

    async readFiles(filesDir,cb,reg=null,with_content=false,withDirs=false) {
        filesDir = this.cleanPath(filesDir);
        let list = [];

        const regex = reg ? 
            new RegExp(reg,'i')
            :null;

        fs.readdir(filesDir, async (err, files) => {
            //handling error
            if (err) {
                console.log('Unable to scan directory: ' + err);
                return list;
            } 
            
            //listing all files using forEach
            await arraySce.forEachAsync(files, async file => 
            {
                // const fpath = filesDir+file;
                const fpath = path.resolve(filesDir, file);
                const stat = await fs.statAsync(fpath);

                if (stat && stat.isDirectory())
                {
                    if(withDirs)
                    {
                        cb(fpath,file,true);
                        list.push(fpath);
                    }

                    return this.readFiles(fpath,cb,reg,with_content,withDirs);
                }

                if(regex && !regex.test(file))
                    return;

                debug.log("reading file "+fpath);

                try 
                {
                    let data;
                    if(with_content)
                    {
                        const data = await this.readFileAsync(fpath);
                        if(data) 
                        {
                            if(cb)
                                cb(fpath,file,false,data);
                        }
                    }
                    else
                    {
                        if(cb)
                            cb(fpath,file,false);
                    }
                    list.push(fpath);
                } 
                catch (error) {
                    debug.error(error.message+error.stack);                            
                }                        
            });
        });   
    }

    pathinfo(p) {
        return path.parse(p);
    }

}

module.exports = new FSService();