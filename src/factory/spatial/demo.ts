import type {SpatialViewSpec} from './topography.js';
export function museumDemo():SpatialViewSpec{
 return {schemaVersion:1,scope:{tenantId:'agntia-demo',workspaceId:'museum'},revision:1,rooms:[{id:'operations',label:'Operaciones',slot:0},{id:'finance',label:'Finanzas',slot:1},{id:'knowledge',label:'Conocimiento y formación',slot:4}],entities:[
 {id:'invoice-flow',roomId:'operations',kind:'process',label:'Facturación',sourceRef:'demo-flow'},
 {id:'review-invoice',roomId:'operations',kind:'task',label:'Revisar factura',sourceRef:'demo-task'},
 {id:'revenue',roomId:'finance',kind:'metric',label:'Ingresos simulados',sourceRef:'demo-revenue',value:52450,unit:'EUR'},
 {id:'cash-flow',roomId:'knowledge',kind:'concept',label:'Flujo de caja',sourceRef:'demo-concept'},
 {id:'finance-guide',roomId:'knowledge',kind:'document',label:'Guía de tesorería',sourceRef:'demo-guide'}
 ],relations:[{from:'invoice-flow',to:'review-invoice',kind:'contains'},{from:'cash-flow',to:'revenue',kind:'relates-to'},{from:'finance-guide',to:'cash-flow',kind:'explains'}]};
}
