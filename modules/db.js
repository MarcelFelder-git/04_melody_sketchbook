import {del,get,keys,set,values} from './idb-src.min.js';


export const db = {
    
    readItem : function(key){
        // liest einen key aus
        return get(key);
    },
    readAll : function (){
        // gibt alle Werte (als Array) zurück
        return values();
    },
    readKeys : function(){
         // gibt alle keys (als Array) zurück
        return keys();
    },
    writeItem : function(key,item){
        // schreibt 1 key:value Paar
        return set(key,item);
    },
    deleteItem : function(key){
        // löscht einen key inkl. wert
        return del(key);
        
    },
    update: function (item) {
        const key = item.id;
        this.writeItem(key,item);
    }
}