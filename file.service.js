const fs = require('fs');
const { promisify } = require('util')
var ppath = require('path');
const arraySce = require("@nxn/ext/array.service");

class FileSce 
{
    constructor() {
        this.readFileAsync = promisify(fs.readFile);
        this._writeFileAsync = promisify(fs.writeFile);
        this._appendFileAsync = promisify(fs.appendFile);
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

    dirname(path) {
        return ppath.dirname(path)
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

    async writeFileAsync(path,data,createDir,append=false,encoding='utf8') {
        if(createDir)
        {
            var parentDir = ppath.dirname(path);
            await this.createDirAsync(parentDir);
        }

        let config = { flag : append? 'a' : 'w'};
        if(encoding)
            config.encoding  = encoding;

        if(append)
            return this._appendFileAsync(path,data);
        else
            return this._writeFileAsync(path,data, config);   
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

    async readFiles(filesDir,cb,reg=null,with_content=false,withDirs=false,orderBy="name") {
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

            // Ordonner les fichiers par ordre alphabétique
            if(orderBy == "name")
            {
                files = files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
            }
            
            //listing all files using forEach
            await arraySce.forEachAsync(files, async file => 
            {
                // const fpath = filesDir+file;
                const fpath = ppath.resolve(filesDir, file);
                const stat = await this.statAsync(fpath);

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

                console.log("reading file "+fpath);

                try 
                {
                    let data;
                    if(with_content)
                    {
                        const data = await this.readFileAsync(fpath);
                        if(data) 
                        {
                            if(cb)
                            {
                                const result = cb(fpath,file,false,data);
                                if (result instanceof Promise)
                                    await result;
                            }
                        }
                    }
                    else
                    {
                        if(cb)
                        {
                            const result = cb(fpath,file,false);
                            if (result instanceof Promise)
                                await result;
                        }                        
                    }
                    list.push(fpath);
                } 
                catch (error) {
                    // debug.error(error.message+error.stack);                            
                }                        
            });
        });
        
        return list;
    }

    pathinfo(p) {
        return ppath.parse(p);
    }

    copyDirSync(src, dest,force) 
    {
        fs.mkdirSync(dest, { recursive: true });

        const files = fs.readdirSync(src);
        
        files.forEach(file => 
        {
          const current = fs.lstatSync(`${src}/${file}`);
          const srcF = `${src}/${file}`;
          const destF = `${dest}/${file}`;
        
          if (current.isDirectory()) 
          {
            this.copyDirSync(srcF, destF);
          } 
          else if (current.isSymbolicLink()) 
          {
            const symlink = fs.readlinkSync(srcF);
            fs.symlinkSync(symlink, destF);
          } 
          else 
          {
            if(!fs.existsSync(destF) || (force=='force')) 
            {
                fs.copyFileSync(srcF, destF);
                console.log("file created : "+destF);
            }
            else
                console.warn("file already exists : "+destF);
          }
        });
    }    

}

module.exports = new FileSce();
module.exports.FSService = FileSce;