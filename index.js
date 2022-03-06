var IPFS = require('ipfs-core');
var formidable = require('formidable');
var http = require('http');
var fs = require('fs');
var formOpt = {uploadDir: `${__dirname}/uploads`, maxFileSize: 200 * 1024 * 1024};

var hosts = ['ipfs.io', 'cloudflare-ipfs.com', 'gateway.ipfs.io'];

var ipfs = null;

if (!fs.existsSync(formOpt.uploadDir)){
	fs.mkdirSync(formOpt.uploadDir);
}

IPFS.create({repo: 'ipfsrepo'}).then((data) => {
	ipfs = data;
	http.createServer(server).listen(8080);
});

function server(req, res) {
	if(req.method == 'POST'){
		const fm = formidable(formOpt);
		
		fm.parse(req, (err, fields, files) => {
			if(err || !files.filetoupload){
				console.log(err);
				res.writeHead(err.httpCode || 400, { 'Content-Type': 'text/plain' });
				res.end("Something wrong");
				return;
			}
			fs.readFile(files.filetoupload.filepath, (err, file) => {
				ipfs.add(file).then((data) => {
					let summary = {
						time: new Date().toISOString(),
						ip: ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
						file: files.filetoupload.originalFilename,
						mime: files.filetoupload.mimetype,
						cid: data.path,
						size: files.filetoupload.size
					};
					console.log(summary)
					fs.unlink(files.filetoupload.filepath, (err, file) => {});
					res.writeHead(200, { 'Content-Type': 'text/plain' });
					res.end('https://' + hosts[Math.floor(Math.random() * hosts.length)] + '/ipfs/' + data.path + '?filename=' + files.filetoupload.originalFilename);
				});
			});
		});
	}else{
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();
  }
}
