module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1747951020504, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./common/abstract_client"), exports);
tslib_1.__exportStar(require("./common/common_client"), exports);
tslib_1.__exportStar(require("./common/interface"), exports);

}, function(modId) {var map = {"./common/abstract_client":1747951020505,"./common/common_client":1747951020513,"./common/interface":1747951020507}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020505, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractClient = void 0;
const tslib_1 = require("tslib");
const sdk_version_1 = require("./sdk_version");
const interface_1 = require("./interface");
const sign_1 = tslib_1.__importDefault(require("./sign"));
const http_connection_1 = require("./http/http_connection");
const tencent_cloud_sdk_exception_1 = tslib_1.__importDefault(require("./exception/tencent_cloud_sdk_exception"));
const sse_response_model_1 = require("./sse_response_model");
const uuid_1 = require("uuid");
/**
 * @inner
 */
class AbstractClient {
    /**
     * 实例化client对象
     * @param {string} endpoint 接入点域名
     * @param {string} version 产品版本
     * @param {Credential} credential 认证信息实例
     * @param {string} region 产品地域
     * @param {ClientProfile} profile 可选配置实例
     */
    constructor(endpoint, version, { credential, region, profile = {} }) {
        this.path = "/";
        /**
         * 认证信息实例
         */
        if (credential && "getCredential" in credential) {
            this.credential = credential;
        }
        else {
            this.credential = Object.assign({
                secretId: null,
                secretKey: null,
                token: null,
            }, credential);
        }
        /**
         * 产品地域
         */
        this.region = region || null;
        this.sdkVersion = "SDK_NODEJS_" + sdk_version_1.sdkVersion;
        this.apiVersion = version;
        this.endpoint = (profile && profile.httpProfile && profile.httpProfile.endpoint) || endpoint;
        /**
         * 可选配置实例
         * @type {ClientProfile}
         */
        this.profile = {
            signMethod: (profile && profile.signMethod) || "TC3-HMAC-SHA256",
            httpProfile: Object.assign({
                reqMethod: "POST",
                endpoint: null,
                protocol: "https://",
                reqTimeout: 60,
            }, profile && profile.httpProfile),
            language: profile.language,
        };
        if (this.profile.language && !interface_1.SUPPORT_LANGUAGE_LIST.includes(this.profile.language)) {
            throw new tencent_cloud_sdk_exception_1.default(`Language invalid, choices: ${interface_1.SUPPORT_LANGUAGE_LIST.join("|")}`);
        }
    }
    async getCredential() {
        if ("getCredential" in this.credential) {
            return await this.credential.getCredential();
        }
        return this.credential;
    }
    /**
     * @inner
     */
    async request(action, req, options, cb) {
        if (typeof options === "function") {
            cb = options;
            options = {};
        }
        try {
            const result = await this.doRequest(action, req !== null && req !== void 0 ? req : {}, options);
            cb && cb(null, result);
            return result;
        }
        catch (e) {
            cb && cb(e, null);
            throw e;
        }
    }
    /**
     * @inner
     */
    async requestOctetStream(action, req, options, cb) {
        if (typeof options === "function") {
            cb = options;
            options = {};
        }
        try {
            const result = await this.doRequest(action, req !== null && req !== void 0 ? req : {}, Object.assign({}, options, {
                headers: {
                    "Content-Type": "application/octet-stream; charset=utf-8",
                },
            }));
            cb && cb(null, result);
            return result;
        }
        catch (e) {
            cb && cb(e, null);
            throw e;
        }
    }
    /**
     * @inner
     */
    async doRequest(action, req, options = {}) {
        if (this.profile.signMethod === "TC3-HMAC-SHA256") {
            return this.doRequestWithSign3(action, req, options);
        }
        let params = this.mergeData(req);
        params = await this.formatRequestData(action, params);
        const headers = Object.assign({}, this.profile.httpProfile.headers, options.headers);
        let traceId = "";
        for (let key in headers) {
            if (key.toLowerCase() === "x-tc-traceid") {
                traceId = headers[key];
                break;
            }
        }
        if (!traceId) {
            traceId = uuid_1.v4();
            headers["X-TC-TraceId"] = traceId;
        }
        let res;
        try {
            res = await http_connection_1.HttpConnection.doRequest({
                method: this.profile.httpProfile.reqMethod,
                url: this.profile.httpProfile.protocol + this.endpoint + this.path,
                data: params,
                timeout: this.profile.httpProfile.reqTimeout * 1000,
                headers,
                agent: this.profile.httpProfile.agent,
                proxy: this.profile.httpProfile.proxy,
                signal: options.signal,
            });
        }
        catch (error) {
            throw new tencent_cloud_sdk_exception_1.default(error.message, "", traceId);
        }
        return this.parseResponse(res);
    }
    /**
     * @inner
     */
    async doRequestWithSign3(action, params, options = {}) {
        const headers = Object.assign({}, this.profile.httpProfile.headers, options.headers);
        let traceId = "";
        for (let key in headers) {
            if (key.toLowerCase() === "x-tc-traceid") {
                traceId = headers[key];
                break;
            }
        }
        if (!traceId) {
            traceId = uuid_1.v4();
            headers["X-TC-TraceId"] = traceId;
        }
        let res;
        try {
            const credential = await this.getCredential();
            res = await http_connection_1.HttpConnection.doRequestWithSign3({
                method: this.profile.httpProfile.reqMethod,
                url: this.profile.httpProfile.protocol + this.endpoint + this.path,
                secretId: credential.secretId,
                secretKey: credential.secretKey,
                region: this.region,
                data: params || "",
                service: this.endpoint.split(".")[0],
                action: action,
                version: this.apiVersion,
                multipart: options && options.multipart,
                timeout: this.profile.httpProfile.reqTimeout * 1000,
                token: credential.token,
                requestClient: this.sdkVersion,
                language: this.profile.language,
                headers,
                agent: this.profile.httpProfile.agent,
                proxy: this.profile.httpProfile.proxy,
                signal: options.signal,
            });
        }
        catch (e) {
            throw new tencent_cloud_sdk_exception_1.default(e.message, "", traceId);
        }
        return this.parseResponse(res);
    }
    async parseResponse(res) {
        const traceId = res.headers.get("x-tc-traceid");
        if (res.status !== 200) {
            const tcError = new tencent_cloud_sdk_exception_1.default(res.statusText, "", traceId);
            tcError.httpCode = res.status;
            throw tcError;
        }
        else {
            if (res.headers.get("content-type") === "text/event-stream") {
                return new sse_response_model_1.SSEResponseModel(res.body);
            }
            else {
                const data = await res.json();
                if (data.Response.Error) {
                    const tcError = new tencent_cloud_sdk_exception_1.default(data.Response.Error.Message, data.Response.RequestId, traceId);
                    tcError.code = data.Response.Error.Code;
                    throw tcError;
                }
                else {
                    return data.Response;
                }
            }
        }
    }
    /**
     * @inner
     */
    mergeData(data, prefix = "") {
        const ret = {};
        for (const k in data) {
            if (data[k] === null || data[k] === undefined) {
                continue;
            }
            if (data[k] instanceof Array || data[k] instanceof Object) {
                Object.assign(ret, this.mergeData(data[k], prefix + k + "."));
            }
            else {
                ret[prefix + k] = data[k];
            }
        }
        return ret;
    }
    /**
     * @inner
     */
    async formatRequestData(action, params) {
        params.Action = action;
        params.RequestClient = this.sdkVersion;
        params.Nonce = Math.round(Math.random() * 65535);
        params.Timestamp = Math.round(Date.now() / 1000);
        params.Version = this.apiVersion;
        const credential = await this.getCredential();
        if (credential.secretId) {
            params.SecretId = credential.secretId;
        }
        if (this.region) {
            params.Region = this.region;
        }
        if (credential.token) {
            params.Token = credential.token;
        }
        if (this.profile.language) {
            params.Language = this.profile.language;
        }
        if (this.profile.signMethod) {
            params.SignatureMethod = this.profile.signMethod;
        }
        const signStr = this.formatSignString(params);
        params.Signature = sign_1.default.sign(credential.secretKey, signStr, this.profile.signMethod);
        return params;
    }
    /**
     * @inner
     */
    formatSignString(params) {
        let strParam = "";
        const keys = Object.keys(params);
        keys.sort();
        for (const k in keys) {
            if (!keys.hasOwnProperty(k)) {
                continue;
            }
            //k = k.replace(/_/g, '.');
            strParam += "&" + keys[k] + "=" + params[keys[k]];
        }
        const strSign = this.profile.httpProfile.reqMethod.toLocaleUpperCase() +
            this.endpoint +
            this.path +
            "?" +
            strParam.slice(1);
        return strSign;
    }
}
exports.AbstractClient = AbstractClient;

}, function(modId) { var map = {"./sdk_version":1747951020506,"./interface":1747951020507,"./sign":1747951020508,"./http/http_connection":1747951020510,"./exception/tencent_cloud_sdk_exception":1747951020509,"./sse_response_model":1747951020512}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020506, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.sdkVersion = void 0;
exports.sdkVersion = "4.1.1";

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020507, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORT_LANGUAGE_LIST = void 0;
/**
 * ClientProfile.language 属性支持的取值列表
 */
exports.SUPPORT_LANGUAGE_LIST = ["zh-CN", "en-US"];

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020508, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const tencent_cloud_sdk_exception_1 = tslib_1.__importDefault(require("./exception/tencent_cloud_sdk_exception"));
const crypto = tslib_1.__importStar(require("crypto"));
const url_1 = require("url");
const json_bigint_1 = tslib_1.__importDefault(require("json-bigint"));
const JSONbigNative = json_bigint_1.default({ useNativeBigInt: true });
/**
 * @inner
 */
class Sign {
    static sign(secretKey, signStr, signMethod) {
        const signMethodMap = {
            HmacSHA1: "sha1",
            HmacSHA256: "sha256",
        };
        if (!signMethodMap.hasOwnProperty(signMethod)) {
            throw new tencent_cloud_sdk_exception_1.default("signMethod invalid, signMethod only support (HmacSHA1, HmacSHA256)");
        }
        const hmac = crypto.createHmac(signMethodMap[signMethod], secretKey || "");
        return hmac.update(Buffer.from(signStr, "utf8")).digest("base64");
    }
    static sign3({ method = "POST", url = "", payload, timestamp, service, secretId, secretKey, multipart, boundary, headers: configHeaders = {}, }) {
        const urlObj = new url_1.URL(url);
        const contentType = configHeaders["Content-Type"];
        // 通用头部
        let headers = "";
        let signedHeaders = "";
        if (method === "GET") {
            signedHeaders = "content-type";
            headers = `content-type:${contentType}\n`;
        }
        else if (method === "POST") {
            signedHeaders = "content-type";
            if (multipart) {
                headers = `content-type:multipart/form-data; boundary=${boundary}\n`;
            }
            else {
                headers = `content-type:${contentType}\n`;
            }
        }
        headers += `host:${urlObj.hostname}\n`;
        signedHeaders += ";host";
        const path = urlObj.pathname;
        const querystring = urlObj.search.slice(1);
        let payload_hash = "";
        if (multipart) {
            const hash = crypto.createHash("sha256");
            hash.update(`--${boundary}`);
            for (const key in payload) {
                const content = payload[key];
                if (Buffer.isBuffer(content)) {
                    hash.update(`\r\nContent-Disposition: form-data; name="${key}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
                    hash.update(content);
                    hash.update("\r\n");
                }
                else if (typeof content === "string") {
                    hash.update(`\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n`);
                    hash.update(`${content}\r\n`);
                }
                hash.update(`--${boundary}`);
            }
            hash.update(`--\r\n`);
            payload_hash = hash.digest("hex");
        }
        else {
            const hashMessage = Buffer.isBuffer(payload) ? payload : JSONbigNative.stringify(payload);
            payload_hash = payload ? getHash(hashMessage) : getHash("");
        }
        const canonicalRequest = method +
            "\n" +
            path +
            "\n" +
            querystring +
            "\n" +
            headers +
            "\n" +
            signedHeaders +
            "\n" +
            payload_hash;
        const date = getDate(timestamp);
        const StringToSign = "TC3-HMAC-SHA256" +
            "\n" +
            timestamp +
            "\n" +
            `${date}/${service}/tc3_request` +
            "\n" +
            getHash(canonicalRequest);
        const kDate = sha256(date, "TC3" + secretKey);
        const kService = sha256(service, kDate);
        const kSigning = sha256("tc3_request", kService);
        const signature = sha256(StringToSign, kSigning, "hex");
        return `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    }
}
exports.default = Sign;
function sha256(message, secret = "", encoding) {
    const hmac = crypto.createHmac("sha256", secret);
    return hmac.update(message).digest(encoding);
}
function getHash(message, encoding = "hex") {
    const hash = crypto.createHash("sha256");
    return hash.update(message).digest(encoding);
}
function getDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
    const day = ("0" + date.getUTCDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

}, function(modId) { var map = {"./exception/tencent_cloud_sdk_exception":1747951020509}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020509, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @inner
 */
class TencentCloudSDKHttpException extends Error {
    constructor(error, requestId = "", traceId = "") {
        super(error);
        this.requestId = requestId || "";
        this.traceId = traceId || "";
    }
    getMessage() {
        return this.message;
    }
    getRequestId() {
        return this.requestId;
    }
    getTraceId() {
        return this.traceId;
    }
    toString() {
        return ("[TencentCloudSDKException]" +
            "message:" +
            this.getMessage() +
            "  requestId:" +
            this.getRequestId() +
            "  traceId:" +
            this.getTraceId());
    }
    toLocaleString() {
        return ("[TencentCloudSDKException]" +
            "message:" +
            this.getMessage() +
            "  requestId:" +
            this.getRequestId() +
            "  traceId:" +
            this.getTraceId());
    }
}
exports.default = TencentCloudSDKHttpException;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020510, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpConnection = void 0;
const tslib_1 = require("tslib");
const querystring_1 = tslib_1.__importDefault(require("querystring"));
const url_1 = require("url");
const is_stream_1 = tslib_1.__importDefault(require("is-stream"));
const get_stream_1 = tslib_1.__importDefault(require("get-stream"));
const form_data_1 = tslib_1.__importDefault(require("form-data"));
const sign_1 = tslib_1.__importDefault(require("../sign"));
const fetch_1 = tslib_1.__importDefault(require("./fetch"));
const json_bigint_1 = tslib_1.__importDefault(require("json-bigint"));
const JSONbigNative = json_bigint_1.default({ useNativeBigInt: true });
/**
 * @inner
 */
class HttpConnection {
    static async doRequest({ method, url, data, timeout, headers = {}, agent, proxy, signal, }) {
        const config = {
            method: method,
            headers: Object.assign({}, headers),
            timeout,
            agent,
            proxy,
            signal,
        };
        if (method === "GET") {
            url += "?" + querystring_1.default.stringify(data);
        }
        else {
            config.headers["Content-Type"] = "application/x-www-form-urlencoded";
            config.body = querystring_1.default.stringify(data);
        }
        return await fetch_1.default(url, config);
    }
    static async doRequestWithSign3({ method, url, data, service, action, region, version, secretId, secretKey, multipart = false, timeout = 60000, token, requestClient, language, headers = {}, agent, proxy, signal, }) {
        // data 中可能带有 readStream，由于需要计算整个 body 的 hash，
        // 所以这里把 readStream 转为 Buffer
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        await convertReadStreamToBuffer(data);
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        data = deepRemoveNull(data);
        const timestamp = parseInt(String(new Date().getTime() / 1000));
        method = method.toUpperCase();
        let payload = "";
        if (method === "GET") {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            data = mergeData(data);
            url += "?" + querystring_1.default.stringify(data);
        }
        if (method === "POST") {
            payload = data;
        }
        const config = {
            method,
            timeout,
            headers: Object.assign({}, headers, {
                Host: new url_1.URL(url).host,
                "X-TC-Action": action,
                "X-TC-Region": region,
                "X-TC-Timestamp": timestamp,
                "X-TC-Version": version,
                "X-TC-Token": token,
                "X-TC-RequestClient": requestClient,
            }),
            agent,
            proxy,
            signal,
        };
        if (token === null || token === undefined) {
            delete config.headers["X-TC-Token"];
        }
        if (region === null || region === undefined) {
            delete config.headers["X-TC-Region"];
        }
        if (language) {
            config.headers["X-TC-Language"] = language;
        }
        let form;
        if (method === "GET") {
            config.headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        if (method === "POST" && !multipart) {
            config.body = data;
            const contentType = config.headers["Content-Type"] || "application/json";
            if (!isBuffer(data))
                config.body = JSONbigNative.stringify(data);
            config.headers["Content-Type"] = contentType;
        }
        if (method === "POST" && multipart) {
            form = new form_data_1.default();
            for (const key in data) {
                form.append(key, data[key]);
            }
            config.body = form;
            config.headers = Object.assign({}, config.headers, form.getHeaders());
        }
        const signature = sign_1.default.sign3({
            method,
            url,
            payload,
            timestamp,
            service,
            secretId,
            secretKey,
            multipart,
            boundary: form ? form.getBoundary() : undefined,
            headers: config.headers,
        });
        config.headers["Authorization"] = signature;
        return await fetch_1.default(url, config);
    }
}
exports.HttpConnection = HttpConnection;
async function convertReadStreamToBuffer(data) {
    for (const key in data) {
        if (is_stream_1.default(data[key])) {
            data[key] = await get_stream_1.default.buffer(data[key]);
        }
    }
}
function mergeData(data, prefix = "") {
    const ret = {};
    for (const k in data) {
        if (data[k] === null) {
            continue;
        }
        if (data[k] instanceof Array || data[k] instanceof Object) {
            Object.assign(ret, mergeData(data[k], prefix + k + "."));
        }
        else {
            ret[prefix + k] = data[k];
        }
    }
    return ret;
}
function deepRemoveNull(obj) {
    if (isArray(obj)) {
        return obj.map(deepRemoveNull);
    }
    else if (isObject(obj)) {
        const result = {};
        for (const key in obj) {
            const value = obj[key];
            if (!isNull(value)) {
                result[key] = deepRemoveNull(value);
            }
        }
        return result;
    }
    else {
        return obj;
    }
}
function isBuffer(x) {
    return Buffer.isBuffer(x);
}
function isArray(x) {
    return Array.isArray(x);
}
function isObject(x) {
    return typeof x === "object" && !isArray(x) && !is_stream_1.default(x) && !isBuffer(x) && x !== null;
}
function isNull(x) {
    return x === null;
}

}, function(modId) { var map = {"../sign":1747951020508,"./fetch":1747951020511}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020511, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const node_fetch_1 = tslib_1.__importDefault(require("node-fetch"));
const https_proxy_agent_1 = tslib_1.__importDefault(require("https-proxy-agent"));
function default_1(url, options) {
    const instanceOptions = options || {};
    const proxy = options.proxy || process.env.http_proxy;
    if (!options.agent && proxy) {
        instanceOptions.agent = new https_proxy_agent_1.default(proxy);
    }
    return node_fetch_1.default(url, instanceOptions);
}
exports.default = default_1;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020512, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEResponseModel = void 0;
const events_1 = require("events");
const readline_1 = require("readline");
class SSEEventEmitter extends events_1.EventEmitter {
}
class SSEResponseModel {
    constructor(stream) {
        this.stream = stream;
        this.readline = readline_1.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });
        this.eventSource = new SSEEventEmitter();
        this.init();
    }
    /**
     * @inner
     */
    init() {
        const { stream, readline, eventSource } = this;
        let lines = [];
        readline.on("line", (line) => {
            if (line) {
                lines.push(line);
                return;
            }
            eventSource.emit("message", this.parseSSEMessage(lines.splice(0)));
        });
        readline.on("close", () => {
            if (lines.length > 0) {
                eventSource.emit("message", this.parseSSEMessage(lines.splice(0)));
            }
        });
        stream.on("close", () => {
            eventSource.emit("close");
        });
        stream.on("error", (err) => {
            eventSource.emit("error", err);
        });
    }
    /**
     * @inner
     */
    parseSSEMessage(lines) {
        const message = {
            data: "",
            event: "",
            id: "",
            retry: undefined,
        };
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // line is of format "<field>:<value>" or "<field>: <value>"
            const colonIndex = line.indexOf(":");
            if (colonIndex <= 0)
                continue; // exclude comments and lines with no values
            const field = line.slice(0, colonIndex);
            const value = line.slice(colonIndex + (line[colonIndex + 1] === " " ? 2 : 1));
            switch (field) {
                case "data":
                    message.data = message.data ? message.data + "\n" + value : value;
                    break;
                case "event":
                    message.event = value;
                    break;
                case "id":
                    message.id = value;
                    break;
                case "retry":
                    const retry = parseInt(value, 10);
                    if (!isNaN(retry)) {
                        // per spec, ignore non-integers
                        message.retry = retry;
                    }
                    break;
            }
        }
        return message;
    }
    on(event, listener) {
        this.eventSource.on(event, listener);
        return this;
    }
    removeListener(event, listener) {
        this.eventSource.removeListener(event, listener);
        return this;
    }
    async *[Symbol.asyncIterator]() {
        let lines = [];
        for await (const line of this.readline) {
            if (line) {
                lines.push(line);
                continue;
            }
            yield this.parseSSEMessage(lines.splice(0));
        }
        if (lines.length > 0) {
            yield this.parseSSEMessage(lines.splice(0));
        }
    }
}
exports.SSEResponseModel = SSEResponseModel;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1747951020513, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonClient = void 0;
const abstract_client_1 = require("./abstract_client");
class CommonClient extends abstract_client_1.AbstractClient {
}
exports.CommonClient = CommonClient;

}, function(modId) { var map = {"./abstract_client":1747951020505}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1747951020504);
})()
//miniprogram-npm-outsideDeps=["tslib","uuid","crypto","url","json-bigint","querystring","is-stream","get-stream","form-data","node-fetch","https-proxy-agent","events","readline"]
//# sourceMappingURL=index.js.map