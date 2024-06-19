import { LightningElement, track, wire, api } from 'lwc';
import getPicklistValues from '@salesforce/apex/DependencyPicklistController.getPicklistValues';
import { updateRecord } from "lightning/uiRecordApi";
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import headerComponentLabel from '@salesforce/label/c.DPC_header';
import saveLabel from '@salesforce/label/c.DPC_BTNSave';
import resetLabel from '@salesforce/label/c.DPC_BTNReset';
import recordtypeLabel from '@salesforce/label/c.DPC_LabelRecordtype';
import subtypeLabel from '@salesforce/label/c.DPC_LabelSubType';
import toolLabel from '@salesforce/label/c.DPC_LabelTool';
import typeLabel from '@salesforce/label/c.DPC_LabelType';

export default class DependencyPicklist extends LightningElement {

  @api recordId;
  labels = {
    headerComponentLabel,
    saveLabel,
    resetLabel,
    recordtypeLabel,
    subtypeLabel,
    toolLabel,
    typeLabel
  };

  recordtypeValueSelected = '';
  subtypeValueSelected = '';
  toolPicklistValueSelected = '';
  typePicklistValueSelected = '';

  mapRecordtypePicklist = new Map();
  mapSubtypePicklist = new Map();
  mapToolPicklist = new Map();

  @track subtypeDisabled = false;
  @track toolDisabled = false;
  @track typeDisabled = false;
  @track recordtypePicklist = [];
  @track subtypePicklist = [];
  @track toolPicklist = [];
  @track typePicklist = [];
  @track isLoading = false;

  connectedCallback(){
    this.subtypeDisabled = true;
    this.toolDisabled = true;
    this.typeDisabled = true;
    this.isLoading = true;
  }

  removeDuplicates(data){

    return data.filter((element, index, self) => 
      index === self.findIndex((v) => v.value === element.value)
      );
  }

  @wire(getPicklistValues)
    wirepicklist( { error, data } ){
      let RecordtypeAux = [];
      if(data){

        data.forEach(element => {
          
          //level 1
          let listAux = [];
          let key = element.Recordtype__c;

          listAux = ( this.mapRecordtypePicklist.get(key)  === undefined) ? listAux = [] : this.mapRecordtypePicklist.get(key);
          
          listAux.push({value: element.SubType__c, label: element.SubType__c});
          this.mapRecordtypePicklist.set(key, listAux);

          //level 2
          key = element.Recordtype__c.concat('-',element.SubType__c);
          listAux = ( this.mapSubtypePicklist.get(key)  === undefined) ? listAux = [] : this.mapSubtypePicklist.get(key);

          listAux.push({value: element.Tool__c, label: element.Tool__c});
          this.mapSubtypePicklist.set(key, listAux);
 
          //level 3  
          key = element.Recordtype__c.concat( '-',element.SubType__c,'-',element.Tool__c);
          listAux = ( this.mapToolPicklist.get(key)  === undefined) ? listAux = [] : this.mapToolPicklist.get(key);
        
          listAux.push({value: element.Type__c, label: element.Type__c});
          this.mapToolPicklist.set(key, listAux);

          RecordtypeAux.push({value: element.Recordtype__c, label: element.Recordtype__c});
        });

        this.recordtypePicklist = this.removeDuplicates(RecordtypeAux);
        this.isLoading = false;

      } else if(error) {
        this.showAlertToast('Error', error.body.message, 'error');
        this.isLoading = false;
      }
  }
  
  
  handleRecordTypeChange(event){
    this.recordtypeValueSelected = event.detail.value;
    let listAux = this.mapRecordtypePicklist.get(this.recordtypeValueSelected);
    this.subtypePicklist = this.removeDuplicates(listAux);
    this.toolPicklist = [];
    this.typePicklist = [];
    this.subtypeValueSelected = this.clearField();
    this.subtypeDisabled = false;
    this.toolDisabled = true;
    this.typeDisabled = true;
  }

  handleSubTypeChange(event){
    let key = this.recordtypeValueSelected.concat('-', event.detail.value);
    this.subtypeValueSelected = event.detail.value;
    this.toolPicklistValueSelected = this.clearField();
    
    let listAux = this.mapSubtypePicklist.get(key);
    this.toolPicklist = this.removeDuplicates(listAux);
    this.toolDisabled = false;
    this.typeDisabled = true;
  }

  handleToolChange(event){
    let key = this.recordtypeValueSelected.concat('-',this.subtypeValueSelected,'-',event.detail.value);
    this.toolPicklistValueSelected = event.detail.value;

    let listAux = this.mapToolPicklist.get(key);
    this.typePicklistValueSelected = this.clearField();
    this.typePicklist = this.removeDuplicates(listAux);
    this.typeDisabled = false;
  }

  handleTypeChange(event){
    this.typePicklistValueSelected = event.detail.value;
  }

  handleSave(event){
    event.preventDefault();
    this.isLoading = true;
    let validate = this.ValidateFields();

    if(validate){
      this.showAlertToast('Empty Field', 'Please fill all the required fields', 'warning')
      this.isLoading = false;
      return;
    }    

    const picklistValues = {
      fields: {
      Id: this.recordId,
      Recordtype__c: this.recordtypeValueSelected,
      SubType__c: this.subtypeValueSelected,
      Tool__c: this.toolPicklistValueSelected,
      Type__c: this.typePicklistValueSelected
      }
    }

    updateRecord(picklistValues)
    .then(() => {
      this.showAlertToast('Record Update', 'Record has been updated!', 'success');
      this.isLoading = false;
    }).catch((error) => {
      console.log('error = '+ error);
      this.showAlertToast('Error', JSON.stringify(error), 'error');
      this.isLoading = false;
    });
  }

  clearField(){
    return '';
  }

  resetFields(){
    this.subtypePicklist = [];
    this.toolPicklist = [];
    this.typePicklist = [];
    this.recordtypeValueSelected = '';
    this.subtypeValueSelected = '';
    this.toolPicklistValueSelected = '';
    this.typePicklistValueSelected = '';
    this.disableToolAndType();
  }

  disableToolAndType(){
    this.toolDisabled = true;
    this.typeDisabled = true;
  }

  showAlertToast(title, message, type){
    
    const event =  new ShowToastEvent({
      title: title,
      message: message,
      variant: type

    });
    this.dispatchEvent(event);
  }

  ValidateFields(){
    return (this.recordtypeValueSelected === '' || this.subtypeValueSelected === '' || this.toolPicklistValueSelected === '' || this.typePicklistValueSelected === '');
  }
}