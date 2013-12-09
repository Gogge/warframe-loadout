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
            "mouseleave div.moduletext": "descriptionPopup"
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
            
            var ancientDisruptor = new Enemies.AncientDisruptor();
            var grineerNapalm = new Enemies.GrineerNapalm();
            var corpusTech = new Enemies.CorpusTech();
            var corpusMoa = new Enemies.CorpusShockwaveMoa();
            var corrosiveProjection = weapon.get('auras').where({name:"Corrosive Projection"})[0].getPercents()["Armor Reduction"];
            
            var ancientAltsZeroMod = ancientDisruptor.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var napalmAltsZeroMod = grineerNapalm.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var techAltsZeroMod = corpusTech.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            var moaAltsZeroMod = corpusMoa.getDamageTaken(weaponResultZeroMod, 25, corrosiveProjection);
            
            var ancientAltsMaxMod = ancientDisruptor.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var napalmAltsMaxMod = grineerNapalm.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var techAltsMaxMod = corpusTech.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);
            var moaAltsMaxMod = corpusMoa.getDamageTaken(weaponResultMaxMod, 25, corrosiveProjection);

            var zeroKeys = Object.keys(ancientAltsZeroMod);
            var maxKeys = Object.keys(ancientAltsMaxMod);
            
            var table = '<table class="scaling"><thead><tr><th>Type</th><th class="right">Ancient</th><th class="right">Napalm</th><th class="right">Tech</th><th class="right">MOA</th></tr></thead><tbody>';
            for(var i=0; i<maxKeys.length; i++){
                var zeroIndex = 0;
                if(zeroKeys.length === maxKeys.length){
                    zeroIndex = i;
                }
                var ancientDps = ancientAltsMaxMod[maxKeys[i]]['DPS'] - ancientAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var napalmDps = napalmAltsMaxMod[maxKeys[i]]['DPS'] - napalmAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var techDps = techAltsMaxMod[maxKeys[i]]['DPS'] - techAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                var moaDps = moaAltsMaxMod[maxKeys[i]]['DPS'] - moaAltsZeroMod[zeroKeys[zeroIndex]]['DPS'];
                table += '<tr><td>';
                table += maxKeys[i] + '</td><td class="right">' + ancientDps.toFixed(0)+ ' </td><td class="right">' + napalmDps.toFixed(0) + '</td><td class="right">' + techDps.toFixed(0) + '</td>' + '</td><td class="right">' + moaDps.toFixed(0) + '</td>';
                table += '</tr>';
            }
            table += '</tbody></table>';
            modElement.children(".totalModDps").append("<br>" + table);
            
            this.$el.find(".popup").toggleClass("hidden");
        },
        render:function(){
            var template = _.template($("#moduleTemplate").html());
            this.$el.html(template({module:this.model}));
        }
    });
    
    return this;
});

