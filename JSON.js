/***********************************************************
Author: 次碳酸钴（admin@web-tinker.com）
Latest: 2014-10-05
Git: https://github.com/YanagiEiichi/JSON.js
Specification:
  http://ecma-international.org/ecma-262/5.1/#sec-15.12.1.2
***********************************************************/
var JSON=JSON||{
  stringify:function(){
    var stack,indent,gap,ReplacerFunction,PropertyList;
    var ObjectToString=Object.prototype.toString;
    var EscapeTable={8:"b",12:"f",10:"n",13:"r",9:"t"};
    var Mat=/(["\\])|([\x08\x09\x0A\x0C\x0D])|([\x00-\x1F])/g;
    var ERR_CirRef="Converting circular structure to JSON.";
    ERR_CirRef=new TypeError("Type Error: "+ERR_CirRef);
    return function(value,replacer,space){
      //Initialize the stack and indent
      stack=[],indent="";
      //Normalize the replacer
      PropertyList=ReplacerFunction=void 0;
      var map,item,i,v;
      if(typeof replacer=="function")
        ReplacerFunction=replacer;
      else if(IsArray(replacer))
        for(PropertyList=[],i=0,map={};i<replacer.length;i++)
          switch(typeof (v=replacer[i])){
            case "object":
              if(!IsString(v)&&!IsNumber(v))continue;
            case "number": v+=""; case "string": item=v;
            default:
              if(item!==void 0&&!(item in map))
                map[item]=PropertyList.push(item);
          };
      //Normalize the gap
      if(typeof space=="object")
        IsNumber(v)&&(space*=1),IsString(v)&&(space+="");
      if(typeof space=="number")
        space=Math.min(10,space|0),gap=Array(space+1).join(" ");
      else if(typeof space=="string")
        gap=space.substr(0,10);
      else gap="";
      //Call main progress
      return Str("",{"":value});
    };
    function Str(key,holder){
      //Deal the toJSON method
      var value=holder[key];
      if(typeof value=="object"&&value!=null)
        if(typeof value.toJSON=="function")
          value=value.toJSON(key,value);
      //Deal the ReplacerFunction
      if(ReplacerFunction!==void 0)
        value=ReplacerFunction.call(holder,key,value);
      //Deal the primary value
      if(typeof value=="object")
        IsNumber(value)&&(value*=1);
        IsString(value)&&(value+="");
        IsBoolean(value)&&value.valueOf();
      //Select result by value type
      switch(value){
        case null:return "null";
        case true:return "true";
        case false:return "false";
        default: switch(typeof value){
          case "string":return Quote(value);
          case "number":return isFinite(value)?value+"":"null";
          case "object":
            //Check circular structure
            for(var i=0;i<stack.length;i++)
              if(stack[i]==value)throw ERR_CirRef;
            //Preserve stack to recursion
            stack.push(value);
            var result=IsArray(value)?JA(value):JO(value);
            stack.pop();
            return result;
          default: return void 0;
        };
      };
    };
    function Quote(value){ //Escape string by table
      return '"'+value.replace(Mat,function(c,$1,$2,$3){
        if($1)return "\\"+c; 
        c=c.charCodeAt(0);
        if($2)return "\\"+EscapeTable[c];
        c=c.toString(16);
        if($3)return "\\u00"+(c.length==1?"0"+c:c);
      })+'"';
    };
    function IsNumber(value){return CC(value,"Number");};
    function IsString(value){return CC(value,"String");}
    function IsBoolean(value){return CC(value,"Boolean");}
    function IsArray(value){return CC(value,"Array");}
    function CC(obj,str){ //Check ClassName
      return ObjectToString.call(obj)=="[object "+str+"]";
    };
    function JO(value){
      //Preserve old indent and increase current indent
      var stepback=indent;
      indent+=gap;
      //Collect fields
      var i,K=[],partial=[],strP,pad=gap?" ":"";
      if(PropertyList!==void 0)K=PropertyList;
      else for(i in value)K.push(i);
      for(i=0;i<K.length;i++)
        if((strP=Str(K[i],value))!==void 0)
          partial.push(Quote(K[i])+":"+pad+strP);
      //Join all result to JSON string
      var properties,final;
      if(partial.length&&gap)
        properties=partial.join(",\n"+indent),
        final="{\n"+indent+properties+"\n"+stepback+"}";
      else final="{"+partial.join(",")+"}";
      //Resume the indent
      indent=stepback;
      return final;
    };
    function JA(value){
      //Preserve old indent and increase current indent
      var stepback=indent;
      indent+=gap;
      //Collect fields
      var i,partial=[],len=value.length,strP;
      for(i=0;i<len;i++)
        strP=Str(i+"",value),
        partial.push(strP===void 0?"null":strP);
      //Join all result to JSON string
      var final,properties;
      if(partial.length==0)final="[]";
      else if(gap)
        properties=partial.join(",\n"+indent),
        final="[\n"+indent+properties+"\n"+stepback+"]";
      else final="["+partial+"]";
      //Resume the indent
      indent=stepback;
      return final;
    };
  }(),parse:function(){
    var str='"(?:\\\\[\\s\\S]|[^\\r\\n"])*"';
    var int="(?:[1-9][0-9]*|0)";
    var dec=int+"(\\.\\d+)?(?:[eE][+-]?\\d+)?";
    var hex="0[xX][0-9a-fA-F]+";
    var num="-?(?:"+dec+"|"+hex+")";
    var kwd="(?:true|false|null)";
    var val="(?:"+str+"|"+num+"|"+kwd+")";
    var itm=str+"\\s*:\\s*"+val;
    var obj="\\{\\s*(?:"+itm+"(?:\\s*,\\s*"+itm+")*)?\\s*\\}";
    var arr="\\[\\s*(?:"+val+"(?:\\s*,\\s*"+val+")*)?\\s*\\]";
    var ObjectMatcher=new RegExp("(?:"+obj+"|"+arr+")","g");
    var ValueMatcher=new RegExp("^\\s*"+val+"\\s*$");
    var Reviver;
    return function(text,reviver){
      Reviver=reviver;
      //Check JSON format
      var data=text+="";
      while(next=data.replace(ObjectMatcher,"null"),next!=data)
        data=next;//,console.log(data)
      if(!ValueMatcher.test(data))
        throw new SyntaxError(
          "SyntaxError: Text is not a JSON."
        );
      //Eval the JSON
      var unfiltered=eval("("+text+")");
      //Filter
      if(typeof reviver=="function")
        return Walk({"":unfiltered},"");
      return unfiltered;
    };
    function Walk(holder,name){
      var val=holder[name],i,len;
      if(typeof val=="object")
        if(val instanceof Array)
          for(i=0,len=val.length;i<len;i++)
            (val[i]=Walk(val,i))!==void 0||delete val[i];
        else
          for(i in val)
            (val[i]=Walk(val,i))!==void 0||delete val[i];
      return Reviver.call(holder,name,val);
    };
  }()
};