import { pinata } from "./config";

export const handleSubmission = async (selectedFile,metadata) => {
    console.log(selectedFile, "selectedFile")
    console.log(metadata, "metadata")
  
    try {
        const upload = await pinata.upload.file(selectedFile)
     
    
        const ipfsUrl = await pinata.gateways.convert(upload.IpfsHash)
        
        metadata['image'] = ipfsUrl;

        // Step 3: Upload metadata as a JSON file
       
        const metadataUpload = await pinata.upload.json(metadata);
        const metaUri = await pinata.gateways.convert(metadataUpload.IpfsHash)
        
        return metaUri
      } catch (error) {
        console.log(error);
      }
  };


 