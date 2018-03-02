import { Component, UIText } from "rainbowui-core";
import { UrlUtil ,Util} from 'rainbow-foundation-tools';
import "../css/style.css";
import PropTypes from "prop-types";
import {CodeTableService} from 'rainbow-foundation-codetable';

export default class Search extends UIText {
    constructor(props) {
        super(props);
        this.idField = this.props.idField;
        this.keyField = this.props.keyField;
        this.effectiveFields = this.props.effectiveFields;
        this.icon = "glyphicon glyphicon-chevron-down";
        this.url = this.props.url;
        this.clear = this.props.clear;
        this.init=true;
        this.select= false;
        this.option = this.buildOption();
        this.clear = true;
        this.value = "";
        this.data = [];
        this.lastId = null;
    }

    componentWillMount(){
        super.componentWillMount();
    }

    renderComponent() {
        return (
            <div className="searchGroup">
                <UIText className="search"  id={this.componentId} {...this.props} onBlur={this.onBlur.bind(this)} suffixIcon={this.icon} onSuffixIconClick={this.onSuffixIconClick.bind(this)}/>
            </div>
        );
    }

    buildOption(){
        const self = this;
        const effectiveFieldsAlias  = this.props.effectiveFieldsAlias;
        if(effectiveFieldsAlias){
            for(let key in effectiveFieldsAlias){
                effectiveFieldsAlias[key] = this.getI18n(effectiveFieldsAlias[key]);
            }
        }
        if(this.props.displayField){
            this.idField = this.props.displayField;
            this.keyField = this.props.displayField;
            this.effectiveFields = [this.props.displayField];
        }
        return {
            effectiveFields: this.effectiveFields,
            effectiveFieldsAlias: effectiveFieldsAlias,
            idField: this.idField,
            keyField: this.keyField,
            searchFields: [this.keyField],
            allowNoKeyword: true,
            multiWord: false,
            separator: ",",
            getDataMethod: "url",
            url: this.url,
            showHeader: false,
            showBtn: true,
            autoDropup: true,
            delayUntilKeyup: true,
            inputWarnColor: 'rgba(255,255,255)',
            delay: 300,
            fnPreprocessKeyword: function (keyword) {
                if(Util.parseBool(self.props.readOnly)) {
                    return ;
                }
                return self.props.paramKey ? self.props.paramKey + "=" + encodeURI(keyword, "UTF-8") : self.keyField + "=" + encodeURI(keyword, "UTF-8");
            },
            fnProcessData: function (json) {
                const data = { value: [] };
                if (json) {
                    for (let index = 0; index < json.length; index++) {
                        data.value.push(json[index]);
                    }
                }
                return data;
            },
            fnAdjustAjaxParam: function(keyword, opts) {
                    const param =  {
                        type: self.props.codeTableName?'POST':'GET',
                        timeout: 10000,
                        beforeSend: function (jqXHR) {
                            const setionToken = sessionStorage.getItem("Authorization");
                            if (setionToken) {
                                jqXHR.setRequestHeader("Authorization", 'Bearer ' + setionToken.substr(13).split("&")[0]);
                            }
                        },
                    };
                    return param;
            }
                
        }
    }

    onSuffixIconClick(){
        const inputObject = $("#"+this.componentId);
        this.value = inputObject.val();
        inputObject.val('');
        inputObject.focus();
        inputObject.click();
    }

    onBlur() {
        const inputObject = $("#" + this.componentId);
        inputObject.closest(".input-group").removeClass("focusborder");

        //inputObject.val(this.value);
        // if (Util.parseBool(this.clear)&&this.select) {
        //     inputObject.val('');
        // }
        // if(!_.isEmpty(inputObject.val())){
        //     debugger;
        //     this.select = true;
        // }
        if(!_.isEmpty(this.value)){
            inputObject.val(this.value);
        }
    }


    componentDidUpdate() {
        const inputObject = $("#" + this.componentId);
        this.setDefaultValue(inputObject);
    }

    componentDidMount() {
        const self = this;
        const inputObject = $("#" + this.componentId);
        inputObject.parent().addClass("input-group");
        inputObject.parent().addClass("search-group");
        inputObject.after('<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>');
        inputObject.focus(() => {
            inputObject.closest(".input-group").addClass("focusborder");

            if(this.init){
                this.buildCodeTableSuggent(self,inputObject);
            }
            this.init=false;
            this.setSplit(inputObject);
        });
        // inputObject.keyup(() => {
        //     const key = inputObject.val().toUpperCase();
        //     const Regx = /^[A-Za-z]+$/;
        //     if(makePy&&Regx.test(key)){
        //         this.data = this.buildPyData(key);
        //         debugger;
        //         inputObject.bsSuggest("destroy");
        //         this.buildSuggest(self,inputObject);
        //         this.setSplit(inputObject);
        //     }
        // });
        inputObject.next().bind('DOMNodeInserted', (e)=>{  
            this.setSplit(inputObject);
        });  
        this.setDefaultValue(inputObject);
        if(!Util.parseBool(this.props.enabled)){
                $("#" + this.componentId).attr("disabled", this.getDisabled());
        }       
    }


    setDefaultValue(inputObject){
        if(this.props.model&&this.props.property){
            const id = this.props.model[this.props.property];
            if(id&&!_.isEmpty(id+"")){
                let param = {
                    CodeTableName:this.props.codeTableName,
                    ConditionMap:this.props.conditionMap,
                }
                CodeTableService.getCodeTable(param).then((data)=>{
                        this.data=this.buildData(data);
                        inputObject.val(this.getDisplayValue(this.data));
              });
            }
        }
    }

    getDisplayValue(datas){
        if(this.props.model){
            const data =  _.find(datas,(data)=>{
                const id = this.props.model[this.props.property];
                if(data.id == id){
                    return data;
                }
            });
            if(data){
                return Util.parseBool(this.props.showCode)?data.display:data.text;
            }else{
                return ""
            }
        }
    }

    setSplit(inputObject){
        if(this.lastId){
            setTimeout(()=>{
                $(inputObject.next().find("tr[data-id="+this.lastId+"]")[0]).addClass("common-split");
                if(!_.isEmpty(this.value)){
                    const trArray = inputObject.next().find("tr");
                    if(trArray.length==2){
                      $(trArray[0]).addClass("common-split");
                    }
                }
            },100);
        }
    }

    buildCodeTableSuggent(self,inputObject){
                let param = {
                    CodeTableName:self.props.codeTableName,
                    ConditionMap:self.props.conditionMap,
                }
                CodeTableService.getCodeTable(param).then((data)=>{
                        self.data=self.buildData(data);
                        self.buildSuggest(self,inputObject);
                        inputObject.val(self.getDisplayValue(self.data));
                        inputObject.click();
                        if(!_.isEmpty(data["common"])){
                            self.lastId = _.last(data["common"]).id;
                            $(inputObject.next().find("tr[data-id="+self.lastId+"]")[0]).addClass("common-split");
                        }
              });
    }
    buildData(datas,self){
        const result = [];
        _.each(datas["common"],(data)=>{
            result.push({"id":data.id,"text":data.text,"display":`${data.id}  ${data.text}`,"py":makePy?makePy(data.text).join(",").toLowerCase():""})
        });
       
        _.each(datas["codes"],(data)=>{
            result.push({"id":data.id,"text":data.text,"display":`${data.id}  ${data.text}`,"py":makePy?makePy(data.text).join(",").toLowerCase():""})
        });
        return result
    }

    buildSuggest(self,inputObject){
        delete self.option["url"];
        delete self.option["fnProcessData"];
        delete self.option["fnPreprocessKeyword"];
        delete self.option["fnAdjustAjaxParam"];
        self.option["getDataMethod"]="data";
        self.option["idField"]="id";
        self.option["keyField"]= Util.parseBool(self.props.showCode)?"display":"text";
        self.option["data"] = {
            "value": self.data
        },
        self.option["twoWayMatch"] = false;
        self.option["multiWord"] = true;
        self.option["separator"] = ' ';
       
        self.option["effectiveFields"]=Util.parseBool(self.props.showCode)?["id","text"]:["text"];
        self.option["searchFields"]=["id","text","py"];
        inputObject.bsSuggest(self.option).on('onDataRequestSuccess', function (e, result) {
           
        }).on('onSetSelectValue', function (e, keyword, data) {
            if (self.props.model&&self.props.property) {
                self.props.model[self.props.property] = data.id;
            }
            if (self.props.onChange) {
                self.props.onChange(data);
            }
            self.select = false;
            self.value = Util.parseBool(self.props.showCode)?data.display:data.text;;
            inputObject.val(self.value);
        }).on('onUnsetSelectValue', function () {
            self.select = true;
        });

    }
};


Search.propTypes = $.extend({}, UIText.propTypes, {
    enabled: PropTypes.oneOf([PropTypes.string, PropTypes.bool]),
    clear: PropTypes.oneOf([PropTypes.string, PropTypes.bool]),
    url: PropTypes.string,
    paramKey: PropTypes.string,
    keyField: PropTypes.string,
    idField: PropTypes.string,
    displayField: PropTypes.string,
    effectiveFields: PropTypes.array,
    effectiveFieldsAlias: PropTypes.object,
    readOnly: PropTypes.oneOf([PropTypes.string, PropTypes.bool])
});

Search.defaultProps = $.extend({}, UIText.defaultProps, {
    readOnly: false,
    clear:false
});

