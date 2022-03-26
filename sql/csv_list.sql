CREATE OR REPLACE VIEW csv_list AS(
WITH non_health_enrollments AS (
    select programinstanceid
    from programinstance
    where programid = 139924
      and deleted = false
      and status = 'ACTIVE'
),
     psi_ranked AS (
         select psi.programinstanceid,
                eventdatavalues,
                row_number() over (partition by psi.programinstanceid order by created desc ) as rank
         from programstageinstance psi
                  join non_health_enrollments nh on nh.programinstanceid = psi.programinstanceid
         where programstageid = 140005
           and deleted = false
           and status = 'ACTIVE'
     ),
     att_name AS (
         select trackedentityinstanceid, value from trackedentityattributevalue where trackedentityattributeid = 139312
     ),
     att_dob AS (
         select trackedentityinstanceid, value from trackedentityattributevalue where trackedentityattributeid = 139318
     ),
     att_sex AS (
         select trackedentityinstanceid, value from trackedentityattributevalue where trackedentityattributeid = 139315
     ),
     att_address AS (
         select trackedentityinstanceid, value from trackedentityattributevalue where trackedentityattributeid = 139324
     ),
     att_mobile AS (
         select trackedentityinstanceid, value from trackedentityattributevalue where trackedentityattributeid = 139341
     ),
     att_landline AS (
         select trackedentityinstanceid, value from trackedentityattributevalue where trackedentityattributeid = 139337
     ),
     teis AS (
         select an.value                   as name,
                ad.value                   as dob,
                asex.value                 as sex,
                addr.value                 as address,
                amob.value                 as mobile,
                aland.value                as landline,
                ti.uid                     as uid,
                ti.trackedentityinstanceid as id
         from trackedentityinstance ti
                  join att_name an on ti.trackedentityinstanceid = an.trackedentityinstanceid
                  join att_dob ad on ti.trackedentityinstanceid = ad.trackedentityinstanceid
                  join att_sex asex on ti.trackedentityinstanceid = asex.trackedentityinstanceid
                  join att_address addr on ti.trackedentityinstanceid = addr.trackedentityinstanceid
                  join att_mobile amob on ti.trackedentityinstanceid = amob.trackedentityinstanceid
                  join att_landline aland on ti.trackedentityinstanceid = aland.trackedentityinstanceid
         where ti.deleted = false)
select t.*,
       pr.eventdatavalues -> 'r1YtZtTBbKZ' ->> 'value' as inadequate_water_sanitation,
       pr.eventdatavalues -> 'riZnnab24ef' ->> 'value' as poverty,
       pr.eventdatavalues -> 'cLNSXKlqjqA' ->> 'value' as food_insecurity
from psi_ranked pr
         join programinstance pi on pr.programinstanceid = pi.programinstanceid
         join teis t on t.id = pi.trackedentityinstanceid
where (pr.eventdatavalues -> 'r1YtZtTBbKZ' ->> 'value')::boolean
   or (pr.eventdatavalues -> 'riZnnab24ef' ->> 'value')::boolean
   or (pr.eventdatavalues -> 'cLNSXKlqjqA' ->> 'value')::boolean);