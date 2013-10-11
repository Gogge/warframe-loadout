define(['jquery', 'underscore', 'backbone', 'loadout/modules', 'loadout/auras'],
function   ($, _, Backbone, Modules, Auras) {
    
    AuraView = Backbone.View.extend({
        tagname:"div",
        className:"aura cell",
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
            var template = _.template($("#auraTemplate").html());
            this.$el.html(template({aura:this.model}));
        }
    });
    
    AuraListView = Backbone.View.extend({
        tagName:"div",
        className:"auraListView",
        initialize:function(){
            _.bindAll(this, "renderAura");
        },
        events:{
            "click div.recalc":"recalc"
        },
        recalc:function(e){
            console.log("click!");
            this.options.collection.trigger('weaponRender');
        },
        renderAura:function(model){
            var auraView = new AuraView({model:model, collection:this.collection});
            auraView.render();
            $(this.el).children("#auras").append(auraView.el);
        },
        render:function(){
            var auraHeaderTemplate = _.template($("#auraHeaderTemplate").html());
            $(this.el).html(auraHeaderTemplate());
            
            this.collection.each(this.renderAura);
        }
    });
    return this;
});

