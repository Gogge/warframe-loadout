define(['jquery', 'underscore', 'backbone'],
function   ($, _, Backbone) {
    
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
            var apdps = (weaponResultMaxMod.apdps - weaponResultZeroMod.apdps).toFixed(0);
            
            modElement.children(".totalModDps").html("<br>" + (this.model.get('maxRanks')-1) + "/" + (this.model.get('maxRanks')-1) + " DPS: " + dps + "/" + apdps);
            this.$el.find(".popup").toggleClass("hidden");
        },
        render:function(){
            var template = _.template($("#moduleTemplate").html());
            this.$el.html(template({module:this.model}));
        }
    });
    
    return this;
});

