Object Schemas:

Unique String Key (email or Nodeflake) - JSON Value

Quyay API will look here to create new objects.

Update:
  Incremend the version # up by one, and then make changes to the JSON.  reindex() will get all objects, and update outdated
  objects.  reindex() will look at the version attribute of an to see if it matches the one listed in the schema doc, which is
  considered to be the latest.

TODO:
  - Create constructors that accept variable # of arguments and assign accordingly
  - Add validation requirements and functions
  - Determine a rollback solution
  - Consider OO javascript