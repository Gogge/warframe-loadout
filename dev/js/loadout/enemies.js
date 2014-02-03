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
            var return_value =  Math.max((Math.pow((level - baseLevel),1.75) * 0.005 * baseArmor + baseArmor) * (100 - corrosiveProjection) / 100, 0);
            
            return return_value;
        },
        getHealth:function(level){
            var effectiveLevel = level - this.get('baseLevel');
            var health = this.get('baseHealth');
            return Math.max((Math.pow(effectiveLevel,2) * 0.015 * health + health));
        },
        getShield:function(level){
            var shield = this.get('baseShield');
            var effectiveLevel = level - this.get('baseLevel');
            return Math.max((Math.pow(effectiveLevel,2) * 0.0075 * shield + shield));
        },
        getDamageTaken:function(result, level, corrosiveProjection){
            var alternatives = {};
            var damageBreakdown = result.damageBreakdown;
            var specialDamage = result.specialDamage;
            var faction = this.get('faction');

            if(!level){
                level = this.get('level');
            }
            if(!corrosiveProjection){
                corrosiveProjection = 0;
            }
            var damageTaken = {};
            var armor = this.getArmor(level, corrosiveProjection);
            var armorMultipliers = this.get('armorMultipliers');
            var damageMultipliers = this.get('damageMultipliers');
            var shieldMultipliers = this.get('shieldMultipliers');
            var armorIgnore = this.get('armorIgnore');
            var shield = this.getShield(level);
            var health = this.getHealth(level);
            var dpsFactor = result["Magazine Capacity"] / (result["Magazine Capacity"] / result["Fire Rate"] + result["Reload Speed"]);
            
            var blast = 0;
            var magnetic = 0;
            var viral = 0;
            var corrosive = 0;
            var gas = 0;
            var radiation = 0;
            
            var modules = Object.keys(result['moduleDamageBreakdown']);
            var numModules = modules.length;
   
            if ((result['damageBreakdown']['Fire'] !== 0) && (result['damageBreakdown']['Freeze'] !== 0)){
                blast = result['damageBreakdown']['Fire'] + result['damageBreakdown']['Freeze'];
            }
            if ((result['damageBreakdown']['Freeze'] !== 0) && (result['damageBreakdown']['Electrical'] !== 0)){
                magnetic = result['damageBreakdown']['Freeze'] + result['damageBreakdown']['Electrical'];
            }
            if ((result['damageBreakdown']['Freeze'] !== 0) && (result['damageBreakdown']['Toxic'] !== 0)){
                viral = result['damageBreakdown']['Freeze'] + result['damageBreakdown']['Toxic'];
            }
            if ((result['damageBreakdown']['Electrical'] !== 0) && (result['damageBreakdown']['Toxic'] !== 0)){
                corrosive = result['damageBreakdown']['Electrical'] + result['damageBreakdown']['Toxic'];
            }
            if ((result['damageBreakdown']['Fire'] !== 0) && (result['damageBreakdown']['Toxic'] !== 0)){
                gas = result['damageBreakdown']['Fire'] + result['damageBreakdown']['Toxic'];
            }
            if ((result['damageBreakdown']['Fire'] !== 0) && (result['damageBreakdown']['Electrical'] !== 0)){
                radiation = result['damageBreakdown']['Fire'] + result['damageBreakdown']['Electrical'];
            }
            
            if(blast && corrosive){
                var element = "";
                var tempElements = {};
                tempElements['Blast'] = 0;
                tempElements['Corrosive'] = 0;
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            //alternatives[element][key] = result['damageBreakdown'][key];
                            if((key !== 'Toxic') && (key !== 'Electrical') && (key !== 'Fire') && (key !== 'Freeze')){
                                tempElements[key] = result['damageBreakdown'][key];
                                if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Blast') && (key !== 'Corrosive')){
                                    element += key + "/";
                                }
                            }
                        }
                    }
                }
                tempElements['Blast'] += blast;
                tempElements['Corrosive'] += corrosive;
                element += "Blast/Corrosive";
                
                alternatives[element] = tempElements;
            } else {
                if(blast){
                    // If the weapon has two modules and 
                    // if the weapon lacks a module with the same base element
                    // if the base damage type is a part of the combined element
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Freeze") || 
                        (result['baseDamageType'] === "Fire"))){
                    
                        // Skip
                        
                        // If we have formed blast and only have two modules then those two modules
                        // is what formed blast, any other combinations are invalid as the module merging
                        // has higher priority then the base element. If the base element is a part of the
                        // combined element but not the same as either of the two modules then it's an
                        // invalid combination.
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Blast'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Fire') && (key !== 'Freeze')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Blast')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Blast'] += blast;
                        element += "Blast";

                        alternatives[element] = tempElements;
                    }
                }
                if(corrosive){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Toxic") || 
                        (result['baseDamageType'] === "Electrical"))){
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Corrosive'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Toxic') && (key !== 'Electrical')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Corrosive')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Corrosive'] += corrosive;
                        element += "Corrosive";

                        alternatives[element] = tempElements;
                    }
                }
            }
            
            if(magnetic && gas){
                var element = "";
                var tempElements = {};
                tempElements['Magnetic'] = 0;
                tempElements['Gas'] = 0;
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            //alternatives[element][key] = result['damageBreakdown'][key];
                            if((key !== 'Toxic') && (key !== 'Fire') && (key !== 'Electrical') && (key !== 'Freeze')){
                                tempElements[key] = result['damageBreakdown'][key];
                                if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Magnetic') && (key !== 'Gas')){
                                    element += key + "/";
                                }
                            }
                        }
                    }
                }
                tempElements['Magnetic'] += magnetic;
                tempElements['Gas'] += gas;
                element += "Magnetic/Gas";
                
                alternatives[element] = tempElements;
            } else {
                if(magnetic){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Freeze") || 
                        (result['baseDamageType'] === "Electrical"))){
                    
                        // Skip
                    
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Magnetic'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Freeze') && (key !== 'Electrical')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Magnetic')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Magnetic'] += magnetic;
                        element += "Magnetic";

                        alternatives[element] = tempElements;
                    }
                }
                if(gas){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Toxic") || 
                        (result['baseDamageType'] === "Fire"))){

                        // Skip

                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Gas'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Toxic') && (key !== 'Fire')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Gas')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Gas'] += gas;
                        element += "Gas";

                        alternatives[element] = tempElements;
                    }
                }
            }
            
            if(viral && radiation){
                var element = "";
                var tempElements = {};
                tempElements['Viral'] = 0;
                tempElements['Radiation'] = 0;
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            //alternatives[element][key] = result['damageBreakdown'][key];
                            if((key !== 'Toxic') && (key !== 'Fire') && (key !== 'Electrical') && (key !== 'Freeze')){
                                tempElements[key] = result['damageBreakdown'][key];
                                if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Viral') && (key !== 'Radiation')){
                                    element += key + "/";
                                }
                            }
                        }
                    }
                }
                tempElements['Viral'] += viral;
                tempElements['Radiation'] += radiation;
                element += "Viral/Radiation";
                
                alternatives[element] = tempElements;
            } else {
                if(viral){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Toxic") || 
                        (result['baseDamageType'] === "Freeze"))){
                    
                        // Skip
                        
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Viral'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Toxic') && (key !== 'Freeze')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Viral')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Viral'] += viral;
                        element += "Viral";

                        alternatives[element] = tempElements;
                    }
                }
                if(radiation){
                    if(!(numModules % 2) && 
                       !result['moduleDamageBreakdown'][result['baseDamageType']] &&
                       ((result['baseDamageType'] === "Electrical") || 
                        (result['baseDamageType'] === "Fire"))){
                    
                        // Skip
                        
                    } else {
                        var element = "";
                        var tempElements = {};
                        tempElements['Radiation'] = 0;
                        for(var key in result['damageBreakdown']){
                            if(result['damageBreakdown'][key] > 0){
                                if(key.indexOf('(DoT') === -1){
                                    //alternatives[element][key] = result['damageBreakdown'][key];
                                    if((key !== 'Electrical') && (key !== 'Fire')){
                                        tempElements[key] = result['damageBreakdown'][key];
                                        if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing') && (key !== 'Radiation')){
                                            element += key + "/";
                                        }
                                    }
                                }
                            }
                        }
                        tempElements['Radiation'] += radiation;
                        element += "Radiation";

                        alternatives[element] = tempElements;
                    }
                }
            }
            // If no combinations it's a single element, or base damage
            if(blast + corrosive + magnetic + viral + gas + radiation === 0){                
                element = "";
                var tempElements = {};
                for(var key in result['damageBreakdown']){
                    if(result['damageBreakdown'][key] > 0){
                        if(key.indexOf('(DoT') === -1){
                            tempElements[key] = result['damageBreakdown'][key];
                            if((key !== 'Impact') && (key !== 'Piercing') && (key !== 'Slashing')){
                                element += key + "/";
                            }
                        }
                    }
                }
                // Remove trailing slash
                if(element !== ""){
                    element = element.slice(0, - 1);
                } else {
                    element = "IPS";
                }
                
                alternatives[element] = tempElements;
            }
            
            // Iterate over each damage alternative and calculate damage/DPS
            for(var alt in alternatives){
                var localShieldDps = 0;
                var localShieldDotDps = 0;
                var localHealthDps = 0;
                var localHealthDotDps = 0;
                
                // We iterate over the alternatives and add the specific dot elements, so they get processed
                // in the for-loop below
                if(specialDamage['DoT']){
                    for(var key in specialDamage['DoT']['damageBreakdown']){
                        if(!alternatives[alt][key]){
                            alternatives[alt][key] = 0;
                        }
                    }
                }
                
                // Iterate over each damage type
                for (var key in alternatives[alt]){
                    var localDamageTaken = 0;
                    var localDotDamageTaken = 0;
                    var localShieldDamageTaken = 0;
                    var localShieldDotDamageTaken = 0;
                    
                    if(damageMultipliers[key]){
                        localDamageTaken += alternatives[alt][key] * (1+damageMultipliers[key]);
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localDotDamageTaken += (specialDamage['DoT']['damageBreakdown'][key] * (1+damageMultipliers[key])) / specialDamage['DoT']['ticks'];
                            }
                        }
                    } else {
                        localDamageTaken += alternatives[alt][key];
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localDotDamageTaken += specialDamage['DoT']['damageBreakdown'][key] / specialDamage['DoT']['ticks'];
                            }
                        }
                    }
                    
                    var armorMult = 0;
                    if (armorMultipliers[key]){
                        armorMult = armorMultipliers[key];
                    }
                    // From Pwnatron's spreadsheet:
                    // 100 / (armor + 100) * damage * damage_type_mp * special_spot_mp
                    // We (currently) just ignore weak spots, and damage multiplier has already been done above

                    // In update 11 they squished the levels, so 100 armor is now 25% mitigation, and armor
                    // is mitigated by some elements
                    // 
                    // Pre 11.3.2:
                    //localDamageTaken = Math.max((1 - (armor / (armor + 300) * armorMult)) * localDamageTaken, 0);
                    //
                    // After 11.3.2:
                    // damage * armor reduction * (1 + armor multiplier)
                    localDamageTaken = Math.max(localDamageTaken * (300 / (armor * (1-armorMult) + 300)) * (1+armorMult), 0);
                    localDotDamageTaken = Math.max(localDotDamageTaken * (300 / (armor * (1-armorMult) + 300)) * (1+armorMult), 0);
                    
                    if(shieldMultipliers[key]){
                        localShieldDamageTaken += alternatives[alt][key] * (1+shieldMultipliers[key]);
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localShieldDotDamageTaken += (specialDamage['DoT']['damageBreakdown'][key] * (1+shieldMultipliers[key])) / specialDamage['DoT']['ticks'];
                            }
                        }
                        
                    } else {
                        localShieldDamageTaken += alternatives[alt][key];
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localShieldDotDamageTaken += specialDamage['DoT']['damageBreakdown'][key] / specialDamage['DoT']['ticks'];
                            }
                        }
                    }
                    
                    // Damage over time DPS
                  
                    if ((localShieldDamageTaken > 0) || (localShieldDotDamageTaken > 0)) {
                        localShieldDps += localShieldDamageTaken * dpsFactor;
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localShieldDotDps += localShieldDotDamageTaken * dpsFactor;
                            }
                        } 
                    }
                    if ((localDamageTaken > 0) || (localDotDamageTaken > 0)) {
                        
                        localHealthDps += localDamageTaken * dpsFactor;
                        
                        if(specialDamage['DoT']){
                            if(specialDamage['DoT']['damageBreakdown'][key]){
                                localHealthDotDps += localDotDamageTaken * dpsFactor;
                            }
                        }
                    }
                }

                if(specialDamage['DoT']){
                    if(specialDamage['DoT']['damageBreakdown'][key]){
                        // We calculate how long it'll take to kill an enemy with an infinitely stacking dot
                        var ratio = -(2*localShieldDps+localShieldDotDps)/(2*localShieldDotDps);
                        var timeToKill = ratio + Math.sqrt((2*shield)/localShieldDotDps + ratio * ratio);
                        var dotDuration = specialDamage['DoT']['ticks'] / specialDamage['DoT']['ticksPerSecond'];
                        // If the enemy dies within the initial stacking period we just use that time to determine DPS
                        if(timeToKill !== 0){
                            if(timeToKill <= dotDuration){
                                localShieldDps = shield / timeToKill;
                            } else {
                                // If the enemy doesn't die within the stacking period we subtract the damage during the initial period
                                // from the HP and calculate the remaining time it would take to kill the mob with sustained DPS.
                                var tempDotDamage = dotDuration*(localShieldDotDps/2*(dotDuration+1) + localShieldDps);
                                var tempShield = shield - tempDotDamage;
                                timeToKill = dotDuration + tempShield / (localShieldDps + localShieldDotDps);
                                localShieldDps = shield / timeToKill;
                            }
                        }
                        
                        ratio = -(2*localHealthDps+localHealthDotDps)/(2*localHealthDotDps);
                        timeToKill = ratio + Math.sqrt((2*health)/localHealthDotDps + ratio * ratio);
                        
                        if(timeToKill !== 0){
                            if(timeToKill < dotDuration){
                                localHealthDps = health / timeToKill;
                            } else {
                                var tempDotDamage = dotDuration*(localHealthDotDps/2*(dotDuration+1) + localHealthDps);
                                var tempHealth = health - tempDotDamage;
                                timeToKill = dotDuration + tempHealth / ((localHealthDps + localHealthDotDps) * dpsFactor);
                                localHealthDps = health / timeToKill;
                            }
                            
                        }
                    }
                }
                
                // Subtract faction damage for unsupported factions, only Orokin in the Void at the moment.
                if(faction === "Orokin"){
                    localHealthDps /= result['factionMod'];
                    localShieldDps /= result['factionMod'];
                }
                
                var shieldRatio = shield/(shield+health);
                
                // Transform total damage to DPS
                alternatives[alt]['DPS'] = (localShieldDps * shieldRatio) + (localHealthDps * (1-shieldRatio));
                // Calculate combined shield + health DPS
                alternatives[alt]['shieldDps'] = localShieldDps;
                alternatives[alt]['healthDps'] = localHealthDps;
                alternatives[alt]['testDps'] = (localShieldDps * shieldRatio) + (localHealthDps * (1-shieldRatio));
            }
            return alternatives;
        }
    });
    
    //
    // Infested
    //
    
     AverageInfested = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Infested",
            baseLevel:1,
            level:1,
            baseArmor:0,
            baseShield:0,
            baseHealth:400,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Piercing':0.0625, 'Slashing':0.225, 'Fire':0.1875, 'Corrosive':0.1875, 'Gas':0.3125,'Freeze':-0.125, 'Toxic':-0.125, 'Radiation':-0.1875, 'Viral':-0.125}
        }
    });
    
    AncientDisrupter = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Ancient disrupter",
            baseLevel:5,
            level:5,
            baseArmor:0,
            baseShield:0,
            baseHealth:400,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Slashing':0.15, 'Blast':0.5, 'Corrosive':0.75, 'Freeze':-0.25, 'Toxic':-0.5, 'Radiation':-0.75}
        }
    });
    
    AncientHealer = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Ancient healer",
            baseLevel:5,
            level:5,
            baseArmor:0,
            baseShield:0,
            baseHealth:400,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Piercing':0.25, 'Freeze':0.5, 'Radiation':0.5, 'Blast':-0.5}
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
            baseArmor:0,
            baseShield:0,
            baseHealth:80,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Gas':0.75, 'Radiation':-0.5, 'Viral':-0.5}
        }
    });
    
    InfestedRunner = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Runner",
            baseLevel:1,
            level:1,
            baseArmor:0,
            baseShield:0,
            baseHealth:80,
            faction:"Infested",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Slashing':0.5, 'Fire':0.5, 'Gas':0.5, 'Freeze':-0.5}
        }
    });
    
    //
    // Grineer
    //
    
    AverageGrineer = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer",
            baseLevel:1,
            level:1,
            baseArmor:100,
            baseShield:0,
            baseHealth:200,
            faction:"Grineer",
            shieldMultipliers:{},
            armorMultipliers:{'Piercing':0.325, 'Freeze':0.125, 'Toxic':0.125, 'Corrosive':0.375,'Radiation':0.375, 'Slashing':-0.325, 'Blast':-0.125, 'Electrical':-0.25, 'Magnetic':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    GrineerNapalm = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Napalm",
            baseLevel:6,
            level:6,
            baseArmor:500,
            baseShield:0,
            baseHealth:600,
            faction:"Grineer",
            shieldMultipliers:{},
            armorMultipliers:{'Piercing':0.15, 'Freeze':0.25, 'Radiation':0.75, 'Slashing':-0.5, 'Electrical':-0.5, 'Magnetic':-0.5},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    GrineerHeavyGunner = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Heavy Gunner",
            baseLevel:8,
            level:1,
            baseArmor:500,
            baseShield:0,
            baseHealth:300,
            faction:"Grineer",
            shieldMultipliers:{},
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    GrineerLancer = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Grineer Lancer",
            baseLevel:1,
            level:1,
            baseArmor:100,
            baseShield:0,
            baseHealth:100,
            faction:"Grineer",
            shieldMultipliers:{},
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
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
            baseArmor:150,
            baseShield:0,
            baseHealth:120,
            faction:"Grineer",
            shieldMultipliers:{},
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    //
    // Corpus
    //
    
    AverageCorpus = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus",
            baseLevel:1,
            level:1,
            baseArmor:0,
            baseShield:200,
            baseHealth:200,
            faction:"Corpus",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.325, 'Freeze':0.25, 'Toxic':0.125,'Magnetic':0.75, 'Piercing':-0.325, 'Corrosive':-0.25,'Fire':-0.25,'Radiation':-0.125},
            damageMultipliers:{'Piercing':0.125, 'Electrical':0.25, 'Radiation':0.125, 'Toxic':0.125, 'Viral':0.25, 'Impact':-0.125, 'Gas':-0.125}
        }
    });
    
    CorpusShockwaveMoa = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus Shockwave Moa",
            baseLevel:15,
            level:15,
            baseArmor:0,
            baseShield:120,
            baseHealth:60,
            faction:"Corpus",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.5, 'Freeze':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Piercing':0.25, 'Electrical':0.5, 'Radiation':0.25, 'Slashing':-0.25, 'Toxic':-0.25}
        }
    });
    
    CorpusTech = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corpus Tech",
            baseLevel:15,
            level:15,
            baseArmor:0,
            baseShield:250,
            baseHealth:700,
            faction:"Corpus",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.15, 'Toxic':0.25, 'Magnetic':0.75, 'Piercing':-0.5, 'Fire':-0.5, 'Corrosive':-0.5},
            damageMultipliers:{'Slashing':0.25, 'Toxic':0.5, 'Viral':0.5, 'Impact':-0.25, 'Gas':-0.25}
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
            baseArmor:0,
            baseShield:150,
            baseHealth:60,
            faction:"Corpus",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.5, 'Freeze':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Toxic':0.5, 'Viral':0.5, 'Impact':-0.25, 'Gas':-0.25}
        }
    });
    
    //
    // Void
    //
    
    AverageCorrupted = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted",
            baseLevel:1,
            level:1,
            baseArmor:140,
            baseShield:80,
            baseHealth:300,
            faction:"Orokin",
            shieldMultipliers:{'Impact':0.2, 'Piercing':-0.06, 'Freeze':0.2, 'Magnetic':0.3, 'Radiation':-0.1},
            armorMultipliers:{'Piercing':0.13, 'Slashing':-0.13, 'Freeze':0.05, 'Electrical':-0.1, 'Toxic':0.05, 'Blast':-0.05, 'Corrosive':0.15, 'Magnetic':-0.1, 'Radiation':0.15},
            damageMultipliers:{'Impact':-0.15, 'Slashing':0.18, 'Cold':-0.05, 'Fire':0.1, 'Toxic':-0.05, 'Electrical':0.1, 'Freeze':-0.05, 'Blast':0.1, 'Corrosive':0.15, 'Gas':-0.25, 'Radiation':-0.1, 'Viral':0.4}
        }
    });
    
    CorruptedHeavyGunner = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Heavy Gunner",
            baseLevel:8,
            level:1,
            baseArmor:500,
            baseShield:0,
            baseHealth:700,
            faction:"Orokin",
            shieldMultipliers:{},
            // Ferrite
            armorMultipliers:{'Piercing':0.5, 'Corrosive':0.75, 'Toxic':0.25, 'Slashing':-0.15, 'Blast':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    CorruptedAncient = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Ancient",
            baseLevel:5,
            level:5,
            baseArmor:0,
            baseShield:0,
            baseHealth:400,
            faction:"Orokin",
            shieldMultipliers:{},
            armorMultipliers:{},
            damageMultipliers:{'Slashing':0.15, 'Blast':0.5, 'Corrosive':0.75, 'Freeze':-0.25, 'Toxic':-0.5, 'Radiation':-0.75}
        }
    });
    
    CorruptedCrewman = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Crewman",
            baseLevel:10,
            level:1,
            baseArmor:0,
            baseShield:150,
            baseHealth:60,
            faction:"Orokin",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.5, 'Freeze':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Slashing':0.25, 'Toxic':0.5, 'Viral':0.5, 'Impact':-0.25, 'Gas':-0.25}
        }
    });
    
    CorruptedLancer = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Lancer",
            baseLevel:10,
            level:1,
            baseArmor:200,
            baseShield:0,
            baseHealth:60,
            faction:"Orokin",
            shieldMultipliers:{},
            // Alloy
            armorMultipliers:{'Piercing':0.15, 'Freeze':0.25, 'Radiation':0.75, 'Slashing':-0.5, 'Electrical':-0.5, 'Magnetic':-0.5},
            damageMultipliers:{'Slashing':0.25, 'Fire':0.25, 'Viral':0.75, 'Impact':-0.25, 'Gas':-0.5}
        }
    });
    
    CorruptedMoa = Enemy.extend({
        initialize:function(){
            //console.log("enemy init");
        },
        defaults:{
            name:"Corrupted Moa",
            baseLevel:15,
            level:15,
            baseArmor:0,
            baseShield:250,
            baseHealth:250,
            faction:"Orokin",
            armorMultipliers:{},
            shieldMultipliers:{'Impact':0.5, 'Freeze':0.5, 'Magnetic':0.75, 'Piercing':-0.15, 'Radiation':-0.25},
            damageMultipliers:{'Piercing':0.25, 'Electrical':0.5, 'Radiation':0.25, 'Slashing':-0.25, 'Toxic':-0.25}
        }
    });
    
    return this;
});
