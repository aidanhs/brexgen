
zip.workerScriptsPath = "js/lib/zip/";

// Example key generated by chrome. Not for use in production.
var pemstring =
  "-----BEGIN PRIVATE KEY-----\n" +
  "MIICdwIBADANBgkqhkiG9w0BAQEFAASCAmEwggJdAgEAAoGBAO3yO4hUrzpJPRR7Y\n" +
  "fXdYSqJ27Wj5CqnVMeQtTtvyZjVQdY0TL4lrMwNkWuCon4qopKlAAznsIhFGdTnKh\n" +
  "Bc6K6p+wBb9RPLC/GhMremIdV1GvC+Oaa8cawLzL/iURb7TWkS+60GTFIHrUJONXQ\n" +
  "VngJSqfJXIc/EBe7E4i39wbXHAgMBAAECgYAl2LmPXajhZHTKpTVXnfauhW7k3USV\n" +
  "ZDgf5extn8I5BPKL15W9SNDLQ/01VHn0B2QEXyo64z847YTGUF5oa962Wt+Z7CIrw\n" +
  "8s0iIwqFZMGzqlVdFA/mhq695Tce9Auo5nm8G6DCBy9FAO+YA/4oarlDVGiZeLXwQ\n" +
  "b9VP5kJecpAQJBAPbuWs85vLpuHMz+n6hsbywgzq07UCQrX5QvStoYPeyKA3MzT8G\n" +
  "5Jwaq0/zLmsHKTseFEpAEps7ng3UB4zft1BcCQQD2r2b7DBd1bkcVBXc8dBBi6FmH\n" +
  "Ux30KkaEMX7WyyhWqGsRZ52+ZEfd0jy21Rq2K/Ka5NT71eZCXL2I9Rb+60nRAkEAt\n" +
  "YOq7y+DAwwUUcBOPrFO24JWStMR6zSS8sv82ur9AhbFyHYMh9wByw3h/K7yWMfNNy\n" +
  "8j4Qf6Upeuc2Fq1F8YCwJBANYtwmazv+ZoYfUBct4dE2EcxSa2ZqpoziLWan8JkrN\n" +
  "ytMs+wHnezXrtn2NKsU975r7PcZBZzfrOVI2F5npcRRECQCnsTr28zbKNBLBh3hIw\n" +
  "3zunEKHrh9Gj5lXbpkGOoHdzpN9AJUXnGNmhLV+hiZ/ImoIIFbWn762Qn5UAP+LCV\n" +
  "bo=\n" +
  "-----END PRIVATE KEY-----";

function pubFromPriv(rsakey) {
  var pubBytes = forge.asn1.toDer(forge.pki.publicKeyToAsn1(rsakey)).getBytes();
  return forge.util.bytesToHex(pubBytes);
}

function hexToBuf(hexstr) {
  if (hexstr % 2 == 1) { hexstr = '0' + hexstr; }
  var l = hexstr.length / 2;
  var buf = new ArrayBuffer(l);
  var byteArr = new Uint8Array(buf);
  for (var i = 0, h; i < l; i++) {
    h = hexstr.slice(i*2, (i*2)+2);
    byteArr[i] = parseInt(h, 16);
  }
  return buf;
}

function getBlob(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);

  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e) {
    if (this.status == 200) {
      var blob = new Blob([this.response]);
      callback(null, blob);
    } else {
      callback(this.status, null);
    }
  };

  xhr.send();
}

/*
 * This turns a web directory of files into a zip.
 * It requires
 * - gitJSON, obtained with the /trees/?recursive=1 github api call
 * - baseUrl, a web folder with contents mapping exactly to those in gitJSON
 *   e.g. "http://www.example.org/a/b/repocontents/"
 * - relPath, a path relative to baseUrl (i.e. a subdirectory of the git repo)
 *   where the extension files may be found.
 *   e.g. "/" (the git repo is a chrome extension), "ext/chrome/"
 */
function zipWebDir(baseURL, relPath, gitJSON, callback) {
  // strip trailing slash from url, trailing and leading from path
  baseUrl = baseURL.replace(/\/$/, "");
  relPath = relPath.replace(/^\/|\/$/g, "");
  // The url to turn into a zip
  var extUrl = baseUrl + "/" + relPath;

  var zipFs = new zip.fs.FS();
  // JS is single threaded, so no need to worry about interleaving
  async.forEach(
    gitJSON.tree,
    function (item, callback) {
      if (item.path.indexOf(relPath) === 0 && relPath !== "") { return callback(); }
      var pathParts = item.path.slice(relPath.length).split("/");
      switch (item.type) {
        case "blob":
          return zipAddBlob(zipFs.root, item.path, extUrl, callback);
        case "tree":
          return zipAddTree(zipFs.root, item.path, callback);
        case "commit":
          console.log("Submodule in '" + item.path + "' not handled");
          return callback();
        default:
          console.log("No idea how to handle " + item.type);
          return callback();
      }
    },
    function (err) { callback(err, zipFs); }
  );
}

function zipMakePath (zipDir, pathParts) {
  if (pathParts.length === 0) {
    return zipDir;
  }
  var name = pathParts[0];
  // Create the dir if necessary
  var subDir = zipDir.getChildByName(name) || zipDir.addDirectory(name);
  return zipMakePath(subDir, pathParts.slice(1));
}

function zipAddTree (zipDir, path, callback) {
  zipMakePath(zipDir, path.split("/"));
  callback();
}

function zipAddBlob (zipDir, path, extUrl, callback) {
  var pathParts = path.split("/");
  var name = pathParts.pop();
  var blobDir = zipMakePath(zipDir, pathParts);
  getBlob(extUrl + "/" + path, function (err, blob) {
    blobDir.addBlob(name, blob);
    callback(err);
  });
}
