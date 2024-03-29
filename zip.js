/**
 * a simple file zipper i wrote. not the most
 * efficient but i specifically designed this
 * to target as many environments as possible
 * and to be compatible with old versions of
 * javascript
 * 
 * used the following resources for guidance.
 * 
 * https://medium.com/@felixstridsberg/the-zip-file-format-6c8a160d1c34
 * https://users.cs.jmu.edu/buchhofp/forensics/formats/pkzip.html
 * https://github.com/pwasystem/zip/blob/main/zip.js
 * 
 */
!function(){

  function push( arr, items ){
    for( var i=0; i<items.length; i++ ){
      arr[ arr.length ] = items[ i ];
    }
    return arr.length;
  }

  /* split a string by a single character */
  function splitAtCh( str, ch, omitEmptyStrings ){    
    var i, pieces=[], piece="";
    for( i=0; i<str.length; i++ ){
      if( str[i] === ch ){
        if( piece.length > 0 ){
          push( pieces, [piece] );
        }
        piece = "";
      }else{
        piece += str[i];
      }
    }
    push( pieces, [piece] );
    if( omitEmptyStrings ){
      var pieces2 = [];
      for( i=0; i<pieces.length; i++ ){
        if( pieces[i] !== "" ){
          push( pieces2, [pieces[i]] );
        }
      }
      return pieces2;
    }
    return pieces;
  }



  /* break an array into chunks equal to maxChunkLength or less and greater than zero */
  function chunk( arr, maxChunkLength ){
    var chunks = [[]];
    var counter = 0;
    for( var i=0; i<arr.length; i++ ){
      push( chunks[chunks.length - 1], [arr[i]] );
      counter ++;
      if( counter === maxChunkLength ){
        push( chunks, [[]] );
        counter = 0;
      }
    }
    return chunks;
  }

  function stripUrlHashAndParams( url ){
    url = splitAtCh( url, "#", true )[0];
    url = splitAtCh( url, "?", true )[0];
    return url;
  }

  function combineArrs( arrs ){
    var out = [];
    for( var i=0; i<arrs.length; i++ ){
      var arr = arrs[i];
      for( var j=0; j<arr.length; j++ ){
        var item = arr[j];
        push( out, [item] );
      }
    }
    return out;
  }


  function join( strings, string ){
    var out = "";
    for( var i=0; i<strings.length; i++ ){
      out += strings[i] + string;
    }
    out = sliceStr( out, 0, -string.length );
    return out;
  }

  function padStart( str, maxLen, char ){
    while( str.length < maxLen ) str = char + str;
    return str;
  }

  function trimSpace( str ){
    while( str[0] === " " ) str = sliceStr( str, 1 );
    while( str[ str.length - 1 ] === " ") str = sliceStr( str, 0, -1 );
    return str;
  }

  function filter( arr, callback ){
    var out = [];
    for( var i=0; i<arr.length; i++ ){
      var item = arr[i];
      var keep = !!callback( item, i, arr );
      if( keep ){
        push( out, [item] );
      }
    }
    return out;
  }

  function sliceStr( str, istart, iend ){
    istart = istart * 1;
    iend = iend * 1;
    if( isNaN(istart) ){
      istart = 0;
    }
    if( isNaN(iend) || iend > str.length ){
      iend = str.length;
    }
    istart = parseInt( istart );
    iend = parseInt( iend );
    if( istart >= str.length ){
      return "";
    }
    if( istart < -str.length ){
      istart = 0;
    }
    if( istart < 0 ){
      istart = str.length + istart;
    }
    if( iend < 0 ){
      iend = str.length + iend;
    }
    if( iend <= istart ){
      return "";
    }
    var out = "";
    for( var i=istart; i<iend; i++ ){
      out += str[i];
    }
    return out;
  }

  function url2bytes( url ){
    var arr = [];
    var xhr = new XMLHttpRequest();
    xhr.open( "GET", url, false );
    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    xhr.send();
    var resp = xhr.response;
    for( var i=0; i<resp.length; i++ ){
      var ch = resp[i];
      var code = ch.charCodeAt() % 256;
      push( arr, [code] );
    }
    return arr;
  }

  function utf8Encode( str ){
    var url = "data:text/plain;charset=utf-8," + str;
    return url2bytes( url );
  }

  function bytes2hexArr( byteArr ){
    var out = [];
    for( var i=0; i<byteArr.length; i++ ){
      var ch = byteArr[i];
      var hex = padStart( ch.toString(16), 2, "0" );
      push( out, [hex] );
    }
    return out;
  }

  function str2hexArr( str ){
    var bytes = utf8Encode( str );
    return bytes2hexArr( bytes );
  }
  
  function hex2byteArr( hex ){
    var arr = splitAtCh( hex, " " );
    var out = [];
    for( var i=0; i<arr.length; i++ ){
      push( out, [parseInt(arr[i],16)] );
    }
    return out;
  }

  function bin2hex( bin ){
    var a = parseInt( sliceStr( bin, 8 ), 2 );
    a = a.toString( 16 );
    a = padStart( a, 2, "0" );
    var b = parseInt( sliceStr( bin, 0, 8), 2 );
    b = b.toString(16);
    b = padStart( b, 2, "0" );
    return a + " " + b;
  }
  
  function dec2bin( dec, size ){
    return padStart( dec.toString(2), size, "0" );
  }

  /* ms-dos style date */
  function msDosDate( lastModified ){
    var hour = dec2bin( lastModified.getHours(), 5 );
    var min = dec2bin( lastModified.getMinutes(), 6 );
    var sec = dec2bin( Math.round( lastModified.getSeconds()/2 ), 5 );
    var year = dec2bin( lastModified.getFullYear() - 1980, 7 );
    var month = dec2bin( lastModified.getMonth() + 1, 4 );
    var day = dec2bin( lastModified.getDate(), 5 );
    return bin2hex( hour + min + sec ) + " " + bin2hex( year + month + day );
  }


  function reverseHex( hex ){
    let hexArr = [];
    for( var i=0; i<hex.length; i+=2 ){
      hexArr[i] = hex[i] + "" +hex[ i + 1 ];
    }
    var filtered = [];
    for( var i=0; i<hexArr.length; i++ ){
      if( hexArr[i] ){
        push( filtered, [hexArr[i]] );
      }
    }
    filtered.reverse();
    return join( filtered, " " );
  }

  function crc32( bytes ){
    for( var a, o=[], c=0; c<256; c++ ){
      a = c;
      for( var f=0; f<8; f++ ){
        a = 1 & a ? 3988292384 ^ a >>> 1 : a >>> 1;
        o[c] = a;
      }
      for( var n=-1, t=0; t<bytes.length; t++ ){
        n = n >>> 8 ^ o[255 & (n^bytes[t])];
      }
    }
    var result = reverseHex( padStart( ((-1^n) >>> 0).toString(16), 8, "0" ) );
    return result;
  }

  function makeHeader( hexStrings, convertToByteArr ){
    var pieces = filter( hexStrings, function(e,n,a){
      return !!trimSpace( e ).length;
    });
    var out = join( pieces, " " );
    if( convertToByteArr ){
      return hex2byteArr( out );
    }else{
      return out;
    }
  }

  function LocalHeader( path, data, lastModified ){

    this.data = data;
    this.lastModified = lastModified;

    this.path = path;
    this.extraField = "";

    this.export = function( convertToByteArr ){

      var signature = "50 4B 03 04";
      var minV = "14 00";
      var bitFlag = "00 00";
      var cmpMethod = "00 00";
      var date = msDosDate( this.lastModified );
      var crc = crc32( this.data );

      var cmpSize = reverseHex( padStart( this.data.length.toString(16), 8, "0" ) );
      var uncmpSize = cmpSize;
      var pathSize = reverseHex( padStart( this.path.length.toString(16), 4, "0" ) );
      var extraFieldSize = reverseHex( padStart( this.extraField.length.toString(16), 4, "0" ) );

      var pathHex = join( str2hexArr( this.path ), " " );
      var extraFieldHex = join( str2hexArr( this.extraField), " " );

      return makeHeader( [
        signature,
        minV,
        bitFlag,
        cmpMethod,
        date,
        crc,
        cmpSize,
        uncmpSize,
        pathSize,
        extraFieldSize,
        pathHex,
        extraFieldHex
      ], convertToByteArr );

    };

  }

  /* diskIndex is the disk where the local file header is */
  /* offset is the distance between start of first disk and the local file header */
  function CentralDirectoryHeader( path, data, lastModified, diskIndex, offset ){

    this.data = data;
    this.lastModified = lastModified;
    this.diskIndex = diskIndex;
    this.offset = offset;
    
    this.path = path;
    this.extraField = "";
    this.comment = "";

    this.export = function( convertToByteArr ){

      var signature = "50 4B 01 02";
      var vMadeBy = "14 00";
      var minV = "14 00";
      var bitFlag = "00 00";
      var cmpMethod = "00 00";
      var date = msDosDate( this.lastModified );
      var crc = crc32( this.data );

      var cmpSize = reverseHex( padStart( this.data.length.toString(16), 8, "0" ) );
      var uncmpSize = cmpSize;
      
      var pathSize = reverseHex( padStart( this.path.length.toString(16), 4, "0" ) );
      var extraFieldSize = reverseHex( padStart( this.extraField.length.toString(16), 4, "0" ) );
      var commentSize = reverseHex( padStart( this.comment.length.toString(16), 4, "0" ) );

      var diskIndexHex = reverseHex( padStart( diskIndex.toString(16), 4, "0" ) );

      var intAttrs = "01 00";
      var extAttrs = "20 00 00 00";

      var offsetHex = reverseHex( padStart( offset.toString(16), 8, "0" ) );

      var pathHex = join( str2hexArr( this.path ), " " );
      var extraFieldHex = join( str2hexArr( this.extraField), " " );
      var commentHex = join( str2hexArr( this.comment), " " );

      return makeHeader( [
        signature,
        vMadeBy,
        minV,
        bitFlag,
        cmpMethod,
        date,
        crc,
        cmpSize,
        uncmpSize,
        pathSize,
        extraFieldSize,
        commentSize,
        diskIndexHex,
        intAttrs,
        extAttrs,
        offsetHex,
        pathHex,
        extraFieldHex,
        commentHex
      ], convertToByteArr );

    };

  }

  function EOCD( thisDiskIndex, cDirStartDiskIndex, thisDiskEntriesCount, cDirEntriesCount, cDirSize, cDirStartOffset ){

    this.comment = "";

    this.export = function( convertToByteArr ){

      var signature = "50 4b 05 06";
      
      var thisDiskIndexHex = reverseHex( padStart( thisDiskIndex.toString(16), 4, "0" ) );
      var cDirStartDiskIndexHex = reverseHex( padStart( cDirStartDiskIndex.toString(16), 4, "0" ) );
      var thisDiskEntriesCountHex = reverseHex( padStart( thisDiskEntriesCount.toString(16), 4, "0" ) );
      var cDirEntriesCountHex = reverseHex( padStart( cDirEntriesCount.toString(16), 4, "0" ) );
      var cDirSizeHex = reverseHex( padStart( cDirSize.toString(16), 8, "0" ) );
      var cDirStartOffsetHex = reverseHex( padStart( cDirStartOffset.toString(16), 8, "0" ) );
      var commentLengthHex = reverseHex( padStart( this.comment.length.toString(16), 4, "0" ) );
      var commentHex = join( str2hexArr( this.comment), " " );

      return makeHeader( [
        signature,
        thisDiskIndexHex,
        cDirStartDiskIndexHex,
        thisDiskEntriesCountHex,
        cDirEntriesCountHex,
        cDirSizeHex,
        cDirStartOffsetHex,
        commentLengthHex,
        commentHex
      ], convertToByteArr );
    };

  }

  
  Zip = function Zip(){

    var entries = {};
    
    /**
     * this adds a file entry to the zip
     * @param {string} path the internal path to the file in the zip
     * @param {number[]} data an array or arraylike containing the bytes
     * @param {number|Date} lastModified date for the file
     */
    this.add = function( path, data, lastModified ){
      path = stripUrlHashAndParams( path );
      if( path in entries ){
        throw "cannot add file, path already in entries"
      }
      entries[ path ] = {
        data : data,
        lastModified : new Date( lastModified )
      };
    };

    /**
     * removes an entry from the zip
     * @param {string} path the path of the entry to remove
     */
    this.remove = function( path ){
      if( path in entries ){
        delete entries[ path ];
      }else{
        throw "cannot delete path, path does not exist"
      }
    };


    /**
     * compile the zip file.
     * 
     * falsy value or Infinity for maxVolumeSize yields Infinite size (1 file)
     * if a value is passed for maxVolumeSize, no matter how large it is, there
     * will always be a separate file for the Central Directory (i.e. the last
     * file), so if you set the max volume size to an absurdly high number that
     * is not infinity or falsy, it will still give you two files.
     * 
     * as for naming conventions i recommend you name the files like so: file.z00,
     * file.z01, file.z02... etc (starting at 0 or 1 is up to you)
     * 
     * @param {number} maxVolumeSize (optional) max size in bytes per volume
     * @returns either a single byte array or an array of byte arrays (you are in
     * charge of turning these into files, array buffs, uint8s, whatever)
     */
    this.export = function( maxVolumeSize ){

      maxVolumeSize = maxVolumeSize || Infinity;
      
      if( maxVolumeSize < Infinity ){

        var byteCount = 0;
        var zipData = [];
        var cDirData = [];
        var entriesCount = 0;

        for( var path in entries ){
          var entry = entries[path];
          entry.offset = byteCount;
          entry.localHeader = new LocalHeader( path, entry.data, entry.lastModified ).export( true );
          entry.size = entry.localHeader.length + entry.data.length;
          entry.startDiskIndex = (byteCount - (byteCount % maxVolumeSize)) / maxVolumeSize;
          entry.cDirHeader = new CentralDirectoryHeader( path, entry.data, entry.lastModified, entry.startDiskIndex, entry.offset ).export( true );
          zipData = combineArrs( [zipData, entry.localHeader, entry.data] );
          cDirData = combineArrs( [cDirData, entry.cDirHeader] );
          byteCount += entry.size;
          entriesCount++;
        }

        var zipDataChunks = chunk( zipData, maxVolumeSize );

        var eocdData = new EOCD(
          zipDataChunks.length,
          zipDataChunks.length,
          entriesCount,
          entriesCount,
          cDirData.length,
          zipData.length
        ).export( true );
        var lastFileData = combineArrs([cDirData,eocdData]);
        push( zipDataChunks, [lastFileData] );
        return zipDataChunks;
        
      }else{

        var byteCount = 0;
        var zipData = [];
        var cDirData = [];
        var entriesCount = 0;

        for( var path in entries ){
          var entry = entries[path];
          entry.offset = byteCount;
          entry.localHeader = new LocalHeader( path, entry.data, entry.lastModified ).export( true );
          entry.size = entry.localHeader.length + entry.data.length;
          entry.startDiskIndex = 0;
          entry.cDirHeader = new CentralDirectoryHeader( path, entry.data, entry.lastModified, entry.startDiskIndex, entry.offset ).export( true );
          zipData = combineArrs( [zipData, entry.localHeader, entry.data] );
          cDirData = combineArrs( [cDirData, entry.cDirHeader] );
          byteCount += entry.size;
          entriesCount++;
        }

        var eocdData = new EOCD(
          0,
          0,
          entriesCount,
          entriesCount,
          cDirData.length,
          zipData.length
        ).export( true );

        zipData = combineArrs( [zipData, cDirData, eocdData] );

        return zipData;

      }

    };

    
  }


}()
