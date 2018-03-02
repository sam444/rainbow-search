import { Component, UIText } from "rainbowui-core";
import { UrlUtil ,Util} from 'rainbow-foundation-tools';
import "../css/style.css";
import PropTypes from "prop-types";
import {CodeTableService} from 'rainbow-foundation-codetable';

export default class Search extends UIText {
    constructor(props) {
        super(props);
        this.idField = this.props.idField;
        this.orgin_keyField = this.props.keyField;
        this.keyField = this.props.keyField;
        this.effectiveFields = this.props.effectiveFields;
        this.icon = "glyphicon glyphicon-search";
        this.url = this.props.url;
        this.clear = this.props.clear;
        this.init=true;
        this.select= false;
        this.option = this.buildOption();

    }

    componentWillMount(){
        super.componentWillMount();
    }

    renderComponent() {
        return (
            <div className="searchGroup">
                <UIText className="search" id={this.componentId} {...this.props} onBlur={this.onBlur.bind(this)} suffixIcon={this.icon} onSuffixIconClick={this.onSuffixIconClick.bind(this)}/>
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
        }else{
            this.keyField = "Display";
        }
        return {
            effectiveFields: this.effectiveFields,
            effectiveFieldsAlias: effectiveFieldsAlias,
            idField: this.idField,
            keyField: this.keyField,
            searchFields: [this.idField,this.keyField,"Display"],
            allowNoKeyword: true,
            separator: ",",
            getDataMethod: "url",
            url: this.url,
            showHeader: this.props.showHeader,
            showBtn: true,
            twoWayMatch:false,
            autoDropup: true,
            delayUntilKeyup: true,
            multiWord: true,
            separator: " ",
            inputWarnColor: 'rgba(255,255,255)',
            delay: 300,
            fnPreprocessKeyword: function (keyword) {
                if(Util.parseBool(self.props.readOnly)) {
                    return ;
                }
                return self.props.paramKey ? self.props.paramKey + "=" + encodeURI(keyword, "UTF-8") : self.keyField + "=" + encodeURI(keyword, "UTF-8");
            },
            fnProcessData: function (json) {
                const data = { value: json };
                if(!self.props.displayField){
                        _.each(json,(j)=>{
                            j["Display"]=j[self.idField]+" "+j[self.orgin_keyField];
                        });
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
        const inputObject = $("#" + this.componentId);
        inputObject.closest(".input-group").addClass("focusborder");

        if (this.props.model) {
            if(this.props.displayField){
                this.props.model[this.props.property] = inputObject.val();
            }else{
                this.props.model[this.props.property] = _.isEmpty(inputObject.val())?null:this.value;
            }
        }
        if (this.props.onBlur) {
            this.props.onBlur();
        }
        this.select = false;
    }


    componentDidUpdate() {
        const inputObject = $("#" + this.componentId);
        inputObject.val(this.props.model[this.props.property]);
    }

    componentDidMount() {
        const self = this;
        const inputObject = $("#" + this.componentId);
        inputObject.parent().addClass("input-group");
        inputObject.parent().addClass("search-group");
        inputObject.after('<ul class="dropdown-menu dropdown-menu-right" role="menu"></ul>');
        this.buildSuggest(this.option,inputObject);
        inputObject.val(this.props.model[this.props.property]);
        if(!Util.parseBool(this.props.enabled)){
                $("#" + this.componentId).attr("disabled", this.getDisabled());
        }       
    }


    buildSuggest(option,inputObject){
        const self = this;
        inputObject.bsSuggest(option).on('onDataRequestSuccess', function (e, result) {
            self.select = true;
            inputObject.closest(".input-group").addClass("focusborder");
        }).on('onSetSelectValue', function (e, keyword, data) {
            if (self.props.model) {
                self.props.model[self.props.property] = data[self.idField];
            }
            if (self.props.onSelectValue) {
                self.props.onSelectValue(data);
            }
            self.select = false;
            // self.value = self.props.displayField?data[self.idField]:data["Display"];
            self.value = self.props.displayField?data[self.idField]:data["Display"];
            inputObject.val(self.value);
        }).on('onUnsetSelectValue', function () {
            self.select = true;
        });
    }
};


Search.propTypes = $.extend({}, UIText.propTypes, {
    enabled: PropTypes.oneOf([PropTypes.string, PropTypes.bool]),
    clear: PropTypes.oneOf([PropTypes.string, PropTypes.bool]),
    showHeader: PropTypes.oneOf([PropTypes.string, PropTypes.bool]),
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
    clear:false,
    showHeader:false
});

