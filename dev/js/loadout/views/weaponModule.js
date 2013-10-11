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
            this.$el.find(".popup").toggleClass("hidden");
        },
        render:function(){
            var template = _.template($("#moduleTemplate").html());
            this.$el.html(template({module:this.model}));
        }
    });
    
    return this;
});

