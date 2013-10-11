define(['jquery', 'underscore', 'backbone', 'loadout/modules'],
function   ($, _, Backbone, Modules) {
    
    CorrosiveProjection = Modules.Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Corrosive Projection", 
            types:{'Armor Reduction':5}, 
            maxRanks:24, 
            currentRank:6,
            baseCost:1
        }
    });
    
    RifleAmp = Modules.Module.extend({
       initialize:function(){
        },
        defaults:{
            name:"Rifle Amp", 
            types:{'Rifle Damage':4.5}, 
            maxRanks:24, 
            currentRank:6,
            baseCost:1
        }
    });
    
    AuraCollection = Backbone.Collection.extend({
       model: Modules.Module
    });
    
    getNewAuraCollection = function(){
        return new AuraCollection([
                 new CorrosiveProjection({currentRank:0}), 
                 new RifleAmp({currentRank:0})
             ]);

    };
    
    return this;
});


