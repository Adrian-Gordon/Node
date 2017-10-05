/*
 * GPNode.js
 */

//nconf=require("nconf");
//var variables=nconf.get('variables');
//var functionSet=nconf.get('functionSet');

// Private

var _nodeid=0;
var _parsePos=0;

function inArray(token,array){
  //logger.info('token: ' + token + " array: " + array);
  for(var i=0;i<array.length;i++){
    if(token == array[i])return(true);
  }

  return(false);
}


// Public
module.exports = GPNode;

function GPNode(args) {
  this.id=_nodeid++;
  if(typeof(args)!=='undefined'){
    this.type=args.type;//function|variable|constant
    this.functionname=args.functionname;//if it is a function
    this.variablename=args.variablename;//if it is a variable
    this.value=args.value;//value if it is a constant;
  }
  

  if(typeof this.functionname !== 'undefined'){
    if(this.functionname=='if<=')
      this.arity=4;
    else this.arity=2;

    if(typeof args.arguments !== 'undefined')
      this.arguments=args.arguments;//new Array(arity);
    else this.arguments=new Array(this.arity);
  }
}



GPNode.prototype.copy = function() {
  var copy=new GPNode({type:this.type,functionname:this.functionname, variablename:this.variablename,value:this.value});

    if(this.type=='function'){
       copy.arguments=new Array(this.arity);

      for(var i=0;i<this.arity;i++){
        copy.arguments[i]=this.arguments[i].copy();
      }
    }

    return(copy);
  
};

GPNode.prototype.toArray=function(){

    if(this.type=='function'){
      //var f=[this];

      var args=[this];

      for(var i=0;i<this.arity;i++){
        var arg=this.arguments[i];
        args=args.concat(arg.toArray());
      }
      return(args);

    }
    else {
      var list=[this];
      return(list);
    }
}

GPNode.prototype.selectIndex=function(isFunction){

    var ar=this.toArray();
    var selected=false;
    var selectedIndex;

    while(!selected){
      var i=Math.floor(Math.random() * ar.length)
      var sn=ar[i]; //randomly select an element

      if(typeof isFunction == 'undefined'){ //no argument, either fn or terminal is acceptable
        selected=true;
        selectedIndex=i;
      }
      else if(isFunction){        //only return a function
        if(sn.type=="function"){
          selected=true;
          selectedIndex=i;

        }
      }
      else if(sn.type != 'function'){   //only returna terminal
        selected=true;
        selectedIndex=i;

      }

      


    }






    return(selectedIndex);


  }

  GPNode.prototype.getAbsError=function(variablebindings){

    var val=this.eval(variablebindings);
    if(isNaN(val)){
      logger.info(this.toStrArr());
      logger.info(JSON.stringify(variablebindings))
    }

    var speed1=variablebindings.speed1;
    var speed2=variablebindings.speed2;

    //var err=variablebindings.speed2-val;

    var observed=((speed2 -speed1)/speed1) * 100000;

    var err=observed - val;

    //logger.info("val: " + val + " err: " + err);

    return(Math.abs(err));

  }



  

 GPNode.prototype.eval=function(variablebindings){ 
    //console.log('eval ' + JSON.stringify(variablebindings));
    try{
      if(this.type=='constant'){
        return(this.value);
      }
      else if(this.type=='variable'){
        return(variablebindings[this.variablename]);
      }
      else if(this.type=='function'){
        var argVals=new Array(this.arity);

        for(var i=0;i<this.arity;i++){
          argVals[i]=this.arguments[i].eval(variablebindings);
        }

        if(this.functionname=='+'){
          var rval=parseFloat(argVals[0]) + parseFloat(argVals[1]);
          if(isNaN(rval)){
            //logger.info(JSON.stringify(this) + " " + rval + " " + JSON.stringify(argVals))
            return(0)
          }
          return(rval);
        }
        else if(this.functionname=='-'){
          var rval=argVals[0] - argVals[1];
          if(isNaN(rval)){
            //logger.info(JSON.stringify(this) + JSON.stringify(argVals))
            return(0)
          }
          return(rval);
          
        }
        else if(this.functionname=='*'){
          var rval=argVals[0] * argVals[1];
          if(isNaN(rval)){
            //logger.info(this.toStrArr() + " " + JSON.stringify(argVals))
            return(0)
          }
          return(rval);
          
        }
        else if(this.functionname=='/'){
          var rval;
          if(argVals[0]==0)rval=0
          else rval=argVals[0] / argVals[1];
          if(isNaN(rval)){
            //logger.info(JSON.stringify(this) + JSON.stringify(argVals));
            return(0)
            
          }
          return(rval);
          
        }
        else if(this.functionname=='^'){
          //logger.info(JSON.stringify(argVals));
          var rval=Math.pow(argVals[0], Math.floor(argVals[1]));
          if(!isFinite(rval)){
            rval=Number.MAX_VALUE;
          }
          if(isNaN(rval)){
            //logger.info(JSON.stringify(this) + JSON.stringify(argVals))
            return(0)
          }
          return(rval);
          
        }
        else if(this.functionname=='if<='){
          if(argVals[0] <= argVals[1]){
            rval=argVals[2];
            if(isNaN(rval)){
              //logger.info(JSON.stringify(this) + JSON.stringify(argVals))
              return(0)
            }
            return(rval)
          }
          else{
            rval=argVals[3];
            if(isNaN(rval)){
              //logger.info(JSON.stringify(this) + JSON.stringify(argVals))
              return(0)
            }
            return(rval);
          }
        }

      }
    }catch(err){
      logger.error(err);
      logger.error(JSON.stringify(this) + " " + JSON.stringify(variablebindings));
      process.exit();
    }

  }

 GPNode.prototype.printStr=function(depth,full){
    var str='' + this.id + " ";
    for(var i=0;i<depth;i++){
      str+=' ';

    }
    if(this.type=='constant'){
      str+=this.value;
      str+='\n';

    }
    else if(this.type=='variable'){
      str+=this.variablename;
      str+='\n';
    }
    else if(this.type=='function'){
      str+=this.functionname + '\n';
      if(full){

        for(var i=0;i<this.arity;i++){
          var arg=this.arguments[i];
          str+=arg.printStr(depth + 1,true);

        }
      }

    }
    return(str);
  }

 GPNode.prototype.toStrArr=function(){
    var str='';// + this.id + " ";
    
    if(this.type=='constant'){
      str+=this.value ;
      str+=',';

    }
    else if(this.type=='variable'){
      str+='"' + this.variablename + '"';
      str+=',';
    }
    else if(this.type=='function'){
      str+='"'+this.functionname + '",';
      if(true){

        for(var i=0;i<this.arity;i++){
          var arg=this.arguments[i];
          str+=arg.toStrArr();// + ',';

        }
      }

    }
    return(str);
  }

  GPNode.prototype.toArrStr=function(arr){
    // + this.id + " ";
    
    if(this.type=='constant'){
      arr.push(this.value) ;
  

    }
    else if(this.type=='variable'){
      arr.push(this.variablename);
      
    }
    else if(this.type=='function'){
      arr.push(this.functionname);
      if(true){

        for(var i=0;i<this.arity;i++){
          var arg=this.arguments[i];
          arr.push(arg.toArrStr(arr));// + ',';

        }
      }

    }
    return(arr);
  }

  GPNode.prototype.parseNode=function(ar,variables,functionSet){
  _parsePos=0;
  return(this.parseNode2(ar,variables,functionSet));

}

GPNode.prototype.parseNode2=function(ar,variables,functionSet){
    //logger.info("parseNode: " + ar + "variables: " + variables);
    var newNode;
    var token=ar[_parsePos];
    if(typeof token !== 'undefined'){
      _parsePos++;

      if(typeof token=='number'){
        newNode=new GPNode({'type':'constant','value':token}); //constant
      }
      else if(inArray(token,variables)){      //variable
        newNode=new GPNode({'type':'variable','variablename':token});
      }
      else if(inArray(token,functionSet)) {

          var arity=2;

        if(token=='if<='){
          arity=4;
        }
        var newNode=new GPNode({'type':'function','functionname':token});

        for(var i=0;i<arity;i++){
          newNode.arguments[i]=this.parseNode2(ar,variables,functionSet);
        }
      


      }

      return(newNode);
    }
  }



