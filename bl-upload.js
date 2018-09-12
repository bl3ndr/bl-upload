import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-ajax/iron-ajax.js'

/**
 * `bl-upload`
 *
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class BlUpload extends PolymerElement {
    static get template() {
        return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <iron-ajax id="getIdRequest" url="[[idUrl]]" method="GET" on-response="_handleIDResponse"></iron-ajax>
      <iron-ajax id="uploadFileRequest" url="[[uploadUrl]]" method="POST" on-response="_handleUploadResponse"></iron-ajax>
    `;
    }

    static get properties() {
        return {
            files: {
                type: Array,
                value: [],
                notify:true,
                observer: '_filesChanged'
            },
            idUrl: {
                type: String,
                value: 'http://172.17.0.2:9333/dir/assign'
            },
            fileCount: {
                type: Number,
                value: 0
            },
            _uploadCandidates: {
                type: Array,
                value: []
            }

        };
    }

    _filesChanged(newValue, oldValue){
        if(newValue !== null && newValue.length !== 0){
            this._fetchIds();
        }
    }

    _fetchIds(){
        if(!this.$.getIdRequest.loading) {
            let idCandidate = this.files[this.fileCount];
            this.push("_uploadCandidates", {"url": "", "file": idCandidate, "status": "fetch-id"});
            this.dispatchEvent(new CustomEvent("bl-upload-on-fetch-id", {detail: {data: idCandidate}}));
            this.$.getIdRequest.generateRequest();
        }
    }

    _uploadFiles(){
        if(!this.$.uploadFileRequest.loading) {
            const uploadCandidate = this._uploadCandidates[this.fileCount];

            uploadCandidate.status = "uploading";
            let formData = new FormData();
            formData.append("file", uploadCandidate.file);

            this.$.uploadFileRequest.url = uploadCandidate.url;
            this.$.uploadFileRequest.body = formData;
            this.$.uploadFileRequest.contentType = null;
            this.dispatchEvent(new CustomEvent("bl-upload-on-upload", {detail: {data: uploadCandidate}}));
            this.$.uploadFileRequest.generateRequest();
        }
    }

    _handleIDResponse(e, detail){
        let response = detail.xhr.response;
        if(detail.status === 200){
            const uploadUrl = "http://"+response.url+"/"+response.fid;
            let uploadCandidate = this._uploadCandidates[this.fileCount];
            uploadCandidate.url = uploadUrl;
            this.dispatchEvent(new CustomEvent("bl-upload-on-id-assigned", {detail: {data: uploadCandidate}}));

            this.fileCount++;

            if(this.files.length > this.fileCount){
                this._fetchIds();
            }
            else{
                this.fileCount = 0;
                this.dispatchEvent(new CustomEvent("bl-upload-on-assign-id-complete", {detail: {data: this._uploadCandidates}}));
                this._uploadFiles();
            }
        }
    }

    _handleUploadResponse(e, detail){
        if(detail.status === 201){
            const uploadedFile = this._uploadCandidates[this.fileCount];
            this.dispatchEvent(new CustomEvent("bl-upload-on-uploaded", {detail: {data: uploadedFile}}));
            this.fileCount++;

            if(this._uploadCandidates.length > this.fileCount){
                this._uploadFiles();
            }
            else{
                this.fileCount = 0;
                this.files = null;
                this.dispatchEvent(new CustomEvent("bl-upload-on-upload-complete", {detail: {data: this._uploadCandidates}}));
                //finish
            }
        }
    }
}

window.customElements.define('bl-upload', BlUpload);
