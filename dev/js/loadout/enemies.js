define(['jquery', 'underscore', 'backbone', 'loadout/auras'],
function   ($, _, Backbone, Auras) {
    Enemy = Backbone.Model.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Default enemy",
            baseLevel:1,
            level:1,
            baseArmor:0,
            faction:"Default"        
        },
        getArmor: function(level, corrosiveProjection){
            var baseArmor = this.get('baseArmor');
            var baseLevel = this.get('baseLevel');
            // From Pwnatron's spreadsheet:
            // (current_level - base_level)^1.40 * 0.01 * base_armor + base_armor
            var return_value =  (Math.pow((level - baseLevel),1.40) * 0.01 * baseArmor + baseArmor) * (100 - corrosiveProjection) / 100;
            
            return return_value;
        },
        getDamageTaken:function(result, level, corrosiveProjection){
            var damageBreakdown = result.damageBreakdown;
            if(!level){
                level = this.get('level');
            }
            if(!corrosiveProjection){
                corrosiveProjection = 0;
            }
            var damageTaken = 0;
            var armor = this.getArmor(level, corrosiveProjection);
            var damageMultipliers = this.get('damageMultipliers');
            var armorIgnore = this.get('armorIgnore');

            for (var key in damageBreakdown){
                var localDamageTaken = 0;
                
                if(damageMultipliers[key]){
                    localDamageTaken += damageBreakdown[key] * damageMultipliers[key];
                } else {
                    localDamageTaken += damageBreakdown[key];
                }
                if(!armorIgnore[key]){
                    // From Pwnatron's spreadsheet:
                    // 100 / (armor + 100) * damage * damage_type_mp * special_spot_mp
                    // We (currently) just ignore weak spots, and damage multiplier has already been done above
                    localDamageTaken = Math.max((100 / (armor + 100) * localDamageTaken), 0);
                }
                damageTaken += localDamageTaken;
            }            
            return (damageTaken * result["Magazine Capacity"]) / (result["Magazine Capacity"] / result["Fire Rate"] + result["Reload Speed"]);
        }
    });
    
    //
    // Infested
    //
    
    AncientDisruptor = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Ancient disruptor",
            baseLevel:5,
            level:5,
            baseArmor:300,
            faction:"Infested",
            damageMultipliers:{'Fire':2},
            armorIgnore:{'Armor Piercing':true, 'Physics Impact':true, 'Poison':true, 'Serrated Blade':true}
        }
    });
    
    InfestedCharger = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Charger",
            baseLevel:1,
            level:1,
            baseArmor:25,
            faction:"Infested",
            damageMultipliers:{'Armor Piercing':0.5, 'Blade':3, 'Serrated Blade':3, 'Supernatural':0, 'Fire':2},
            armorIgnore:{'Armor Piercing':true, 'Physics Impact':true, 'Poison':true, 'Serrated Blade':true}
        }
    });
    
    //
    // Grineer
    //
    
    GrineerNapalm = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Napalm",
            baseLevel:6,
            level:6,
            baseArmor:50,
            faction:"Grineer",
            damageMultipliers:{},
            armorIgnore:{'Armor Piercing':true, 'Physics Impact':true, 'Poison':true, 'Serrated Blade':true}
        }
    });
    
    GrineerTrooper = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Trooper",
            baseLevel:1,
            level:1,
            baseArmor:200,
            faction:"Grineer",
            damageMultipliers:{'Armor Piercing':1.5, 'Electrical':1.25, 'Fire':1.25},
            armorIgnore:{'Armor Piercing':true, 'Physics Impact':true, 'Poison':true, 'Serrated Blade':true}
        }
    });
    
    //
    // Corpus
    //
    
    CorpusTech = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus Tech",
            baseLevel:15,
            level:15,
            baseArmor:50,
            faction:"Corpus",
            damageMultipliers:{'Electrical':2.0},
            armorIgnore:{'Armor Piercing':true, 'Physics Impact':true, 'Poison':true, 'Serrated Blade':true}
        }
    });
    
    CorpusCrewman = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus Crewman",
            baseLevel:1,
            level:1,
            baseArmor:25,
            faction:"Corpus",
            damageMultipliers:{'Electrical':2.0},
            armorIgnore:{'Armor Piercing':true, 'Physics Impact':true, 'Poison':true, 'Serrated Blade':true}
        }
    });
    
    return this;
});
