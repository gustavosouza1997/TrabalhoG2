const fs = require('fs');

function read_files_from_folder(path) {
    console.log(`Read all files from ${path}`);
    return fs.readdirSync(path);
};

function delete_files_from_folder(file) {
    console.log(`Deleted file ${file}`);
    fs.unlinkSync(file);
}


//read_files_to_upload();
module.exports = { read_files_from_folder, delete_files_from_folder };