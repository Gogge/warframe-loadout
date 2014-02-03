define(['jquery', 'underscore', 'backbone', 'loadout/enemies'],
function   ($, _, Backbone, Enemies) {
    
    ModuleView = Backbone.View.extend({
        tagname:"div",
        className:"module",
        events: {
            "click div.inc": "increase",
            "click div.dec": "decrease",
            "click div.mid": "toggle",
            "mouseenter div.moduletext": "descriptionPopup",
            "mouseleave div.moduletext": "descriptionPopdown"
        },

        increase: function(e){
            e.preventDefault();
            if ((this.model.get("currentRank") + 1) <= this.model.get("maxRanks")){
                this.model.set("currentRank", this.model.get("currentRank") + 1);
                this.options.weaponView.updateDps();
                this.options.weaponView.render();
            }
        },
        decrease: function(e){
            e.preventDefault();
            if ((this.model.get("currentRank") - 1) >= 0){
                this.model.set("currentRank", this.model.get("currentRank") - 1);
                this.options.weaponView.updateDps();
                this.options.weaponView.render();
            }
        },
        toggle: function(e){
            e.preventDefault();
            if (this.model.get("currentRank") > 0){
                this.model.set("currentRank", 0);
            } else {
                this.model.set("currentRank", this.model.get('maxRanks'));
            }
            this.options.weaponView.updateDps();
            this.options.weaponView.render();
        },
        descriptionPopup:function(e){
            var currentRank = this.model.get('currentRank');
            var weapon = this.options.weaponView.model;
            this.model.set('currentRank', 0);
            var modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultZeroMod = weapon.getDps(modPercentages, "");
            this.model.set('currentRank', this.model.get('maxRanks'));
            modPercentages = weapon.getCalculatedModPercentages();
            var weaponResultMaxMod = weapon.getDps(modPercentages, "");
            this.model.set('currentRank', currentRank);
            var modElement = this.$el.find(".popup");
            var dps = (weaponResultMaxMod.dps - weaponResultZeroMod.dps).toFixed(0);
            if (dps >= 0) {
                dps = "+" + dps;
            }
            //var apdps = (weaponResultMaxMod.apdps - weaponResultZeroMod.apdps).toFixed(0);
            
            //modElement.children(".totalModDps").html("<br>" + (this.model.get('maxRanks')-1) + "/" + (this.model.get('maxRanks')-1) + " DPS: " + dps + "/" + apdps);
            modElement.children(".totalModDps").html("<br>" + (this.model.get('maxRanks')-1) + "/" + (this.model.get('maxRanks')-1) + " DPS: " + dps);
            
            var infested = new Enemies.AverageInfested();
            var grineer = new Enemies.AverageGrineer();
            var corpus = new Enemies.AverageCorpus();
            var corrupted = new Enemies.AverageCorrupted();
            var corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            
            
            
            var infestedAltsZeroMod = infested.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var grineerAltsZeroMod = grineer.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var corpusAltsZeroMod = corpus.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var corruptedAltsZeroMod = corrupted.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            
            var infestedAltsMaxMod = infested.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var grineerAltsMaxMod = grineer.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var corpusAltsMaxMod = corpus.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var corruptedAltsMaxMod = corrupted.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);

            var zeroKeys = Object.keys(infestedAltsZeroMod);
            var maxKeys = Object.keys(infestedAltsMaxMod);
            
            var table = '<table class="scaling"><thead><tr><th>Type</th><th class="right">Infested</th><th class="right">Grineer</th><th class="right">Corpus</th><th class="right">Void</th></tr></thead><tbody>';
            for(var i=0; i<maxKeys.length; i++){
                var zeroIndex = 0;
                if(zeroKeys.length === maxKeys.length){
                    zeroIndex = i;
                }
                
                var infestedDps = infestedAltsMaxMod[maxKeys[i]]['DPS'] - infestedAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var grineerDps = grineerAltsMaxMod[maxKeys[i]]['DPS'] - grineerAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var corpusDps = corpusAltsMaxMod[maxKeys[i]]['DPS'] - corpusAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var corruptedDps = corruptedAltsMaxMod[maxKeys[i]]['DPS'] - corruptedAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];

                table += '<tr><td>';
                table += maxKeys[i] + '</td><td class="right">' + ((infestedDps>0)?"+":"") + infestedDps.toFixed(0)+ ' </td><td class="right">' + ((grineerDps>0)?"+":"") + grineerDps.toFixed(0) + '</td><td class="right">' + ((corpusDps>0)?"+":"") + corpusDps.toFixed(0) + '</td><td class="right">' + ((corruptedDps>0)?"+":"") + corruptedDps.toFixed(0) + '</td>' + '</td>';
                table += '</tr>';
            }
            table += '</tbody></table>';
            modElement.children(".totalModDps").append("<br><br>DPS change against factions:");
            modElement.children(".totalModDps").append("<br>" + table);
            
            //var factionDamageTemplate = _.template($("#factionDamageTemplate").html());
            //modElement.children(".totalModDps").append(factionDamageTemplate({module:this.model}));
            
            this.$el.find(".popup").removeClass("hidden");
        },
        descriptionPopdown:function(e){
            this.$el.find(".popup").addClass("hidden");
        },
        render:function(){
            var template = _.template($("#moduleTemplate").html());
            this.$el.html(template({module:this.model}));
        }
    });
    
    return this;
});

