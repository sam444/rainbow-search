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

    }

    componentWillMount(){
        super.componentWillMount();
    }

    renderComponent() {
        return (
            <div className="searchGroup">
                <UIText className="search" id={this.componentId} {...this.props} onBlur={this.onBlur.bind(this)} suffixIcon={this.icon} onSuffixIconClick={this.onSuffixIconClick.bind(this)}/>
                <input className="search_display" id={this.componentId+"_display"}/>
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
        const input = $("#"+this.componentId);
        input.focus();
        input.click();
    }

    onBlur() {
        if (Util.parseBool(this.clear)&&this.select) {
            const inputObject = $("#" + this.componentId);
            inputObject.val('');
        }
      
        this.select = false;
    }


    componentDidUpdate() {
        const inputObject = $("#" + this.componentId);
        inputObject.val(this.props.model[this.keyField]);
    }

    componentDidMount() {
        const self = this;
        const inputObject = $("#" + this.componentId);
        const displayInput=inputObject.parent().parent().parent().next();

        inputObject.parent().addClass("input-group");
        inputObject.parent().addClass("search-group");
        inputObject.after('<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>');
        inputObject.focus(() => {
            if(this.init){
                this.buildCodeTableSuggent(self,inputObject);
            }
            this.init=false;
        });
        displayInput.focus(() => {
            displayInput.hide();
            inputObject.focus();
            inputObject.click();
        });

        inputObject.val(this.props.model[this.keyField]);
        if(!Util.parseBool(this.props.enabled)){
                $("#" + this.componentId).attr("disabled", this.getDisabled());
        }       
    }

    buildCodeTableSuggent(self,inputObject){
                let param = {
                    CodeTableName:self.props.codeTableName,
                    ConditionMap:self.props.conditionMap,
                }
                CodeTableService.getCodeTable(param).then((data)=>{
                        delete self.option["url"];
                        delete self.option["fnProcessData"];
                        delete self.option["fnPreprocessKeyword"];
                        delete self.option["fnAdjustAjaxParam"];
                        self.option["getDataMethod"]="data";
                        self.option["idField"]="id";
                        self.option["keyField"]="display";
                        self.option["data"] = {
                            "value": self.buildData(data["codes"])
                        }
                        self.option["effectiveFields"]=["id","text"];
                        self.option["searchFields"]=["id","text"];
                        self.buildSuggest(self.option,inputObject);
                        inputObject.click();
              });
    }

    buildData(datas){
        const result = [];
        _.each(datas,(data)=>{
            result.push({"id":data.id,"text":data.text,"display":`${data.id} ${data.text}`})
        });
        return result
    }

    buildSuggest(option,inputObject){
        const self = this;
        const displayInput=inputObject.parent().parent().parent().next();

        inputObject.bsSuggest(option).on('onDataRequestSuccess', function (e, result) {
            self.select = false;
            if (self.props.model) {
                self.props.model[self.keyField] = inputObject.val();
            }
        }).on('onSetSelectValue', function (e, keyword, data) {
            if (self.props.model) {
                self.props.model[self.idField] = keyword.id;
                self.props.model[self.keyField] = keyword.key;
            }
            if (self.props.onSelectValue) {
                self.props.onSelectValue(data);
            }
            self.select = false;
            inputObject.val("");
            displayInput.val(keyword.key);
            displayInput.show();
            inputObject.next().next().focus();
            debugger;
        }).on('onUnsetSelectValue', function () {
            self.select = true;
            displayInput.show();
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



