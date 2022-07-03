const { BlobServiceClient } = require('@azure/storage-blob');
const { QueueClient, QueueServiceClient } = require("@azure/storage-queue");
const { read_files_from_folder } = require('./files.js');
const { streamToText } = require("./utils/streamToText");
const { DownloaderHelper } = require('node-downloader-helper');
const fs = require('fs');
const lz4 = require('lz4');
const path_ = require('path');
const parser = require('xml2json');
const json_path = './jsons_to_upload/';
require('dotenv').config();

async function upload_to_container(connectionString, containerName, file) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(path_.basename(file));

    const input = fs.readFileSync(file);
    const output = lz4.encode(input);

    const uploadBlobResponse = await blockBlobClient.upload(output, output.length);
    console.log(`Uploaded: ${path_.basename(file)}. RequestID: ${uploadBlobResponse.requestId}`);
};

async function get_urls(connectionString, queueName) {
    const queueClient = new QueueClient(connectionString, queueName);
    const number_of_messages = (await queueClient.getProperties()).approximateMessagesCount;
    const messages_url = [];
    
    for (let i = 0; i < number_of_messages; i++) {
        const response = await queueClient.receiveMessages();
        response.receivedMessageItems.forEach((message) => {
            const queue = JSON.parse(Buffer.from(message.messageText, "base64").toString());
        
            messages_url.push({ 
                messagesID: queue.id,
                name: path_.basename(queue.data.url),
                urls: queue.data.url
            });
        })

    }

    console.log(`Got all urls from ${queueName}`);
    return messages_url;
};

async function download_and_convert_file(queue, path) {
    //queue.forEach((file) => {
    for (const file of queue) {
        const download = new DownloaderHelper(file.urls, path);

        download.on('end', () => {

            console.log(`Download Completed: ${path}${file.name}`)
        });
        download.start();
    };

    await convert_file(path);
};

async function convert_file(path) {
    const queue_to_convert = await read_files_from_folder(path);

    //queue_to_convert.forEach((file) => {
    for (const file of queue_to_convert) {
        const file_path = `${path}${file}`;
        const file_name = path_.basename(file_path);

        console.log(`Converting: ${file_name}`);

        const file_to_convert = fs.readFileSync(file_path);
        const decoded_file = lz4.decode(file_to_convert);
        
        const json = parser.toJson(decoded_file);
        const json_name = `${json_path}${file_name.replace('.xml', '.json')}`;

        fs.writeFileSync(json_name, json);

        fs.unlink(file_path, err => {
            if (err) throw err;
            console.log(`Deleted: ${file_path}`);
        });
    };
};

module.exports = { get_urls, upload_to_container, download_and_convert_file };