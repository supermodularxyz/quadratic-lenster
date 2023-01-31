'use strict';

var fs = require('fs');
var path = require('path');
var os = require('os');
var ethers = require('defender-relay-client/lib/ethers');
var ethers$1 = require('ethers');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var Curator="0x4Aea85D9a99a8389dF3C55db746260C060989C07";var RoundImplementation="0xCb964E66dD4868e7C71191D3A1353529Ad1ED2F5";var NotificationChannelID="3238a3e4-02ed-43b4-b0f5-a6fe1eb13325";var RelayerID="8cf47d53-d96b-433d-bccd-895d7f82eedb";var deployments = {Curator:Curator,RoundImplementation:RoundImplementation,NotificationChannelID:NotificationChannelID,RelayerID:RelayerID};

var curatorAbi = [{inputs:[{internalType:"address",name:"grantRoundAddress",type:"address"},{internalType:"address",name:"operator",type:"address"}],stateMutability:"nonpayable",type:"constructor"},{anonymous:false,inputs:[{indexed:false,internalType:"address",name:"newAddress",type:"address"}],name:"GrantsRoundUpdated",type:"event"},{anonymous:false,inputs:[{indexed:false,internalType:"address",name:"account",type:"address"}],name:"Paused",type:"event"},{anonymous:false,inputs:[{indexed:true,internalType:"bytes32",name:"role",type:"bytes32"},{indexed:true,internalType:"bytes32",name:"previousAdminRole",type:"bytes32"},{indexed:true,internalType:"bytes32",name:"newAdminRole",type:"bytes32"}],name:"RoleAdminChanged",type:"event"},{anonymous:false,inputs:[{indexed:true,internalType:"bytes32",name:"role",type:"bytes32"},{indexed:true,internalType:"address",name:"account",type:"address"},{indexed:true,internalType:"address",name:"sender",type:"address"}],name:"RoleGranted",type:"event"},{anonymous:false,inputs:[{indexed:true,internalType:"bytes32",name:"role",type:"bytes32"},{indexed:true,internalType:"address",name:"account",type:"address"},{indexed:true,internalType:"address",name:"sender",type:"address"}],name:"RoleRevoked",type:"event"},{anonymous:false,inputs:[{indexed:false,internalType:"address",name:"account",type:"address"}],name:"Unpaused",type:"event"},{inputs:[],name:"CURATOR_ADMIN_ROLE",outputs:[{internalType:"bytes32",name:"",type:"bytes32"}],stateMutability:"view",type:"function"},{inputs:[],name:"DEFAULT_ADMIN_ROLE",outputs:[{internalType:"bytes32",name:"",type:"bytes32"}],stateMutability:"view",type:"function"},{inputs:[],name:"PROGRAM_OPERATOR_ROLE",outputs:[{internalType:"bytes32",name:"",type:"bytes32"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"role",type:"bytes32"}],name:"getRoleAdmin",outputs:[{internalType:"bytes32",name:"",type:"bytes32"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"role",type:"bytes32"},{internalType:"address",name:"account",type:"address"}],name:"grantRole",outputs:[],stateMutability:"nonpayable",type:"function"},{inputs:[{internalType:"bytes32",name:"role",type:"bytes32"},{internalType:"address",name:"account",type:"address"}],name:"hasRole",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"},{inputs:[],name:"pause",outputs:[],stateMutability:"nonpayable",type:"function"},{inputs:[],name:"paused",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"},{inputs:[{internalType:"bytes32",name:"role",type:"bytes32"},{internalType:"address",name:"account",type:"address"}],name:"renounceRole",outputs:[],stateMutability:"nonpayable",type:"function"},{inputs:[{internalType:"bytes32",name:"role",type:"bytes32"},{internalType:"address",name:"account",type:"address"}],name:"revokeRole",outputs:[],stateMutability:"nonpayable",type:"function"},{inputs:[{internalType:"bytes4",name:"interfaceId",type:"bytes4"}],name:"supportsInterface",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"},{inputs:[],name:"unpause",outputs:[],stateMutability:"nonpayable",type:"function"},{inputs:[{internalType:"address",name:"updatedGrantRoundAddress",type:"address"}],name:"updateGrantRoundAddress",outputs:[],stateMutability:"nonpayable",type:"function"},{inputs:[{components:[{internalType:"uint256",name:"protocol",type:"uint256"},{internalType:"string",name:"pointer",type:"string"}],internalType:"struct MetaPtr",name:"newRoundMetaPtr",type:"tuple"}],name:"updateMetaPtr",outputs:[],stateMutability:"nonpayable",type:"function"}];

var name="dotenv";var version$1="16.0.3";var description="Loads environment variables from .env file";var main$1="lib/main.js";var types="lib/main.d.ts";var exports$1={".":{require:"./lib/main.js",types:"./lib/main.d.ts","default":"./lib/main.js"},"./config":"./config.js","./config.js":"./config.js","./lib/env-options":"./lib/env-options.js","./lib/env-options.js":"./lib/env-options.js","./lib/cli-options":"./lib/cli-options.js","./lib/cli-options.js":"./lib/cli-options.js","./package.json":"./package.json"};var scripts={"dts-check":"tsc --project tests/types/tsconfig.json",lint:"standard","lint-readme":"standard-markdown",pretest:"npm run lint && npm run dts-check",test:"tap tests/*.js --100 -Rspec",prerelease:"npm test",release:"standard-version"};var repository={type:"git",url:"git://github.com/motdotla/dotenv.git"};var keywords=["dotenv","env",".env","environment","variables","config","settings"];var readmeFilename="README.md";var license="BSD-2-Clause";var devDependencies={"@types/node":"^17.0.9",decache:"^4.6.1",dtslint:"^3.7.0",sinon:"^12.0.1",standard:"^16.0.4","standard-markdown":"^7.1.0","standard-version":"^9.3.2",tap:"^15.1.6",tar:"^6.1.11",typescript:"^4.5.4"};var engines={node:">=12"};var packageJson = {name:name,version:version$1,description:description,main:main$1,types:types,exports:exports$1,scripts:scripts,repository:repository,keywords:keywords,readmeFilename:readmeFilename,license:license,devDependencies:devDependencies,engines:engines};

const version = packageJson.version;

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;

// Parser src into an Object
function parse (src) {
  const obj = {};

  // Convert buffer to string
  let lines = src.toString();

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n');

  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1];

    // Default undefined or null to empty string
    let value = (match[2] || '');

    // Remove whitespace
    value = value.trim();

    // Check if double quoted
    const maybeQuote = value[0];

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2');

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\r/g, '\r');
    }

    // Add to object
    obj[key] = value;
  }

  return obj
}

function _log (message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`);
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

// Populates process.env from .env file
function config (options) {
  let dotenvPath = path.resolve(process.cwd(), '.env');
  let encoding = 'utf8';
  const debug = Boolean(options && options.debug);
  const override = Boolean(options && options.override);

  if (options) {
    if (options.path != null) {
      dotenvPath = _resolveHome(options.path);
    }
    if (options.encoding != null) {
      encoding = options.encoding;
    }
  }

  try {
    // Specifying an encoding returns a string instead of a buffer
    const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, { encoding }));

    Object.keys(parsed).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
        process.env[key] = parsed[key];
      } else {
        if (override === true) {
          process.env[key] = parsed[key];
        }

        if (debug) {
          if (override === true) {
            _log(`"${key}" is already defined in \`process.env\` and WAS overwritten`);
          } else {
            _log(`"${key}" is already defined in \`process.env\` and was NOT overwritten`);
          }
        }
      }
    });

    return { parsed }
  } catch (e) {
    if (debug) {
      _log(`Failed to load ${dotenvPath} ${e.message}`);
    }

    return { error: e }
  }
}

const DotenvModule = {
  config,
  parse
};

var config_1 = DotenvModule.config;
var parse_1 = DotenvModule.parse;
var main = DotenvModule;
main.config = config_1;
main.parse = parse_1;

config_1();
var ADMIN_API_KEY = process.env.ADMIN_API_KEY || "";
var ADMIN_API_SECRET = process.env.ADMIN_API_SECRET || "";
var DEFAULT_CURATOR = deployments.Curator;
var CURATOR_ABI = curatorAbi;

var creds = { apiKey: ADMIN_API_KEY, apiSecret: ADMIN_API_SECRET };
function handler(event) {
    return __awaiter(this, void 0, void 0, function () {
        var contractPayload, transaction, matchReasons, provider, signer, forwarder, newRoundMetaPr, tx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Or if you know what type of sentinel you'll be using
                    if (!event.request) {
                        console.error("No request found");
                        return [2 /*return*/];
                    }
                    contractPayload = event.request.body;
                    transaction = contractPayload.transaction, matchReasons = contractPayload.matchReasons;
                    console.log("Transaction: ");
                    console.log(transaction);
                    console.log("matchReasons: ");
                    console.log(matchReasons);
                    provider = new ethers.DefenderRelayProvider(creds);
                    signer = new ethers.DefenderRelaySigner(creds, provider, {
                        speed: "fast"
                    });
                    forwarder = new ethers$1.Contract(DEFAULT_CURATOR, CURATOR_ABI, signer);
                    newRoundMetaPr = [1, "tr0l0l0l0l0l0l0l0l0l0l"];
                    return [4 /*yield*/, forwarder.updateMetaPtr(newRoundMetaPr)];
                case 1:
                    tx = _a.sent();
                    console.log("Sent tx: ".concat(tx.hash));
                    return [2 /*return*/, { txHash: tx.hash }];
            }
        });
    });
}

exports.handler = handler;
