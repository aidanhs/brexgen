
zip.workerScriptsPath = "js/lib/zip/";

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

function zipWebDir(baseURL, relPath, gitJSON, callback) {
  // strip trailing slash from url, trailing and leading from path
  // Where the git submodule is located
  baseUrl = baseURL.replace(/\/$/, "");
  // The relative path in the git submodule
  relPath = relPath.replace(/^\/|\/$/g, "");
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
    function (err) { console.log("done"); z = zipFs; }
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
