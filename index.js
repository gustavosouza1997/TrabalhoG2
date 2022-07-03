const { read_files_from_folder } = require('./files.js');
const { get_urls, upload_to_container, download_file, convert_file } = require('./azure.js');
const path_to_upload = "./files_to_upload/";
const path_to_convert = "./files_to_convert/";
const path_json = "./jsons_to_upload/";
const connectionStringXML = "DefaultEndpointsProtocol=https;AccountName=trabalhog2xml;AccountKey=ObPgVnfd/Yyq6+sziN6FeCoWdtJg5ZaWTmxKFg1lmYjRKrjngTyFC1utEtsHblE82QYnboH9QyJn+AStumgigQ==;EndpointSuffix=core.windows.net";
const connectionStringJSON = "DefaultEndpointsProtocol=https;AccountName=trabalhog2json;AccountKey=9r4vWkEcLlDiPUHBJRfk3CZGFcB1YcqWEZd1EOlt6XrAebmz+c0ROWjREvLaELjgqxpcNC7K0hp0+ASt3sAP4g==;EndpointSuffix=core.windows.net";
const containerxml = "contoso-xml";
const containerjson = "contoso-json";
const queueXML = "xml-received";
const queueJSON = "json-received";

async function main() {
    /*const data_to_upload = read_files_from_folder(path_to_upload);

    for (const file of data_to_upload) {
        await upload_to_container(connectionStringXML, containerxml, `${path_to_upload}${file}`);
    };*/

    console.log("Upload of XML's Completed, awaiting Azure Queue update...");

    const received_queueXML = await get_urls(connectionStringXML, queueXML);

    await download_file(received_queueXML, path_to_convert);
    await convert_file(path_to_convert);

    const json_to_upload = read_files_from_folder(path_json);

    for (const file of json_to_upload) {
        await upload_to_container(connectionStringJSON ,containerjson, `${path_json}${file}`);
    };    

    console.log("Upload of JSON's Completed, awaiting Azure Queue update...");

    const received_queueJSON = await get_urls(connectionStringJSON, queueJSON);
    console.log(received_queueJSON);

}

main();