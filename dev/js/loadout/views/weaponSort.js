define(['jquery', 'underscore', 'backbone'],
function   ($, _, Backbone) {
    
    //
    // The actual list of sorteable items is in views/weapon.js
    //
    
    SortType = Backbone.Model.extend({
        initialize:function(){
        },
        defaults:{
            name:"Default sort"
        }
    });
    
    SortCollection = Backbone.Collection.extend({
       model: SortType
    });
    
    SortView = Backbone.View.extend({
        tagName:"div",
        className:"divitis",
        events: {
            "click .sortType": "sort_toggle"
        },
        sort_toggle: function(e){
            e.preventDefault();
            var current_div = $("#" + this.model.get('weaponType')).find("#sortContainer").find("." + this.model.get('name').toLowerCase().replace(/ /g,''));
            if(this.options.weaponCategory.sort_key === this.model.get('name').toLowerCase().replace(/ /g,'')) {
                    this.options.weaponCategory.sort_asc[this.options.weaponCategory.sort_key] = !this.options.weaponCategory.sort_asc[this.options.weaponCategory.sort_key];
                    if (this.options.weaponCategory.sort_asc[this.options.weaponCategory.sort_key]){
                        current_div.removeClass("desc");
                        current_div.addClass("asc");
                    } else {
                        current_div.removeClass("asc");
                        current_div.addClass("desc");
                    }
            } else {
                this.options.weaponCategory.sort_key = this.model.get('name').toLowerCase().replace(/ /g,'');
            }

            this.options.weaponCategory.sort();
            this.options.weaponCategoryView.render();
            $("#" + this.model.get('weaponType')).find("#sortContainer").find(".sortType").addClass("faded");
            $("#" + this.model.get('weaponType')).find("#sortContainer").find(".sortType." + this.model.get('name').toLowerCase().replace(/ /g,'')).removeClass("faded");
        },
        render:function(){
            var template = _.template($("#sortTemplate").html());
            this.$el.html(template({sortType:this.model, sort_name:this.options.weaponCategory.sort_key, sort_asc:this.options.weaponCategory.sort_asc[this.model.get('name').toLowerCase().replace(/ /g,'')]}));
        }
    });
    
    SortListView = Backbone.View.extend({
        tagName:"div",
        className:"divitis",        
        initialize:function(){
            _.bindAll(this, "renderSort");
        },
        renderSort:function(model){
            var sortView = new SortView({model:model, weaponCategory:this.options.weaponCategory, weaponCategoryView:this.options.weaponCategoryView});
            sortView.render();
            $(this.el).append(sortView.el);
        },
        render:function(){
            this.collection.each(this.renderSort);
        }
    });
    
    return this;
});

