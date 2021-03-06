/**
 * Created by bai on 2015/9/1.
 */


WeiboConfig.attachSchema(new SimpleSchema({
    weiboAccount: {
        type: String,
        optional: true
    },
    autoPublish: {
        type: Boolean,
        optional: true
    },
    timerSchedule: {
        type: String,
        optional: true
    },
    waitData: {
        type: Boolean,
        optional: true
    },
    template: {
        type: String
    },
    code: {
        type: String,
        optional: true
    },
    token: {
        type: String,
        optional: true
    },
    expires_in: {
        type: String,
        optional: true
    },
    auth_time: {
        type: Date,
        optional: true
    }
}));

WeiboRecord.attachSchema(new SimpleSchema({
    date: {
        type: Date,
        autoValue: function () {
            return new Date();
        }
    },
    content: {
        type: String,
        optional: true
    },
    status: {
        type: Boolean
    },
    error: {
        type: String,
        optional: true
    }
}));


WeiboConfig.allow({
    insert: function () {
        //TODO roles auth here
        return true;
    }, update: function () {
        //TODO roles auth here
        return true;
    }
})

WeiboRecord.allow({
    insert: function () {
        //TODO roles auth here
        return true;
    },
    remove: function () {
        return true;
    }
})

Meteor.publish('weiboConfig', function () {
    return WeiboConfig.find();
})

Meteor.publish('weiboRecord', function (page, count) {
    return WeiboRecord.find({}, { sort: { date: -1 }, skip: (page - 1) * count, limit: count });
})


