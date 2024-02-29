const fs = require('fs');
const pdf = require('pdf-parse');
var ppath = require('path');

const debug = require("@nxn/debug")('Pdf2text');
const FlowNode = require("@nxn/boot/node");

class Pdf2textNode extends FlowNode
{
    constructor() {
        super();
    }

    async init(config,ctxt,...injections) {
        super.init(config,ctxt,injections);

        this.ocr = this.getInjection('ocr');
    }

    async processMessage(message) {
        let filename,dataBuffer,name;

        try 
        {
            if(message.data && message.data.path)
            {
                filename = message.data.path || message.data;
                name = ppath.basename(filename);
                dataBuffer = fs.readFileSync(filename);
            }
            else if(message.data.indexOf && message.data.indexOf("%PDF-")===0)
            {
                dataBuffer = message.data;
                name = message.name;
                filename = name;
            }
            else {
                this.error("no data");
                throw new Error("incorrect/missing pdf data");
            }

            let data = await pdf(dataBuffer);
            
            if(data.text.trim())
            {
                let msgOut = {
                    name:name,
                    data:{
                        text: data.text, 
                        path:filename
                    }
                };
                data.text = null;
                msgOut.data.meta = data;
                msgOut.data.dir = ppath.dirname(filename);
                        
                if(this.canSendMessage()) {
                    try {
                        await this.sendMessage(msgOut);
                    } catch (error) {
                        debug.log("ERROR :"+error.message+error.stack);
                    }
                }
            }
            else if(this.ocr)
            {
                // no text => send to OCR
                try {
                    message.data.data =  dataBuffer;
                    await this.sendMessage(message,this.ocr);
                } catch (error) {
                    debug.log("ERROR :"+error.message+error.stack);
                }
            }
        }

        catch(error) {
            let message = error.message || error;
            let code = parseInt(error.code||500, 10) || 500;
            debug.error(error.stack||error);
        }        
    }
}

class Pdf2textNodeFactory
{
    constructor () {
        this.instances={};
    }
    getInstance(instName) {
        if(this.instances[instName])
            return this.instances[instName];

        return (this.instances[instName] = new Pdf2textNode(instName));
    }
}

module.exports = new Pdf2textNodeFactory();