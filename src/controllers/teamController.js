const { User, Investment, Withdraw, Income } = require('../models');
const { Op, fn, literal } = require("sequelize");
const jwt = require("jsonwebtoken");
const authMiddleware = require('../middleware/authMiddleware');
const { getVip} = require("../services/userService");



const getUsersByIds = async (ids) => {
    return ids.length ? await User.findAll({ where: { id: { [Op.in]: ids } }, order: [['id', 'DESC']] }) : [];
};

const getTeamStats = async (team) => {
    if (team.length === 0) return { recharge: 0, withdraw: 0, earning: 0 };
    
    const usernames = team.map(user => user.username);

    const [recharge, withdraw, earning] = await Promise.all([
        Investment.sum('amount', { where: { user_id_fk: { [Op.in]: usernames }, status: 'Active' } }),
        Withdraw.sum('amount', { where: { user_id_fk: { [Op.in]: usernames }, status: 'Approved' } }),
        Income.sum('comm', { where: { user_id_fk: { [Op.in]: usernames } } })
    ]);

    return { recharge, withdraw, earning };
};

const myLevelTeam = async (userId, level = 5) => {
    let arrin = [userId];
    let ret = {};
    let i = 1;
    
    while (arrin.length > 0) {
        const allDown = await User.findAll({
            attributes: ['id'],
            where: { sponsor: { [Op.in]: arrin } }
        });

        if (allDown.length > 0) {
            arrin = allDown.map(user => user.id);
            ret[i] = arrin;
            i++;
            // if (i > level) break;
        } else {
            arrin = [];
        }
    }
    return Object.values(ret).flat();
};

const myLevelTeamCount2 = async (userId, level = 5) => {
    let arrin = [userId];
    let ret = {};
    let i = 1;
    
    while (arrin.length > 0) {
        const allDown = await User.findAll({
            attributes: ['id'],
            where: { sponsor: { [Op.in]: arrin } }
        });

        if (allDown.length > 0) {
            arrin = allDown.map(user => user.id);
            ret[i] = arrin;
            i++;
            if (i > level) break;
        } else {
            arrin = [];
        }
    }
    return ret;
};
const myLevelTeamCount2_new = async (userId, level = 5) => {
    let arrin = [userId];
    let ret = {};
    let i = 1;
    
    while (arrin.length > 0) {
        const allDown = await User.findAll({
            attributes: ['id'],
            where: { sponsor: { [Op.in]: arrin } }
        });

        if (allDown.length > 0) {
            arrin = allDown.map(user => user.id);
            ret[i] = arrin;
            i++;
            // if (i > level) break;
        } else {
            arrin = [];
        }
    }
    return ret;
};


const myLevelTeamCountNew = async (userId, level = 5) => {
    let arrin = [userId];
    let ret = {};
    let i = 1;
    
    while (arrin.length > 0) {
        const allDown = await User.findAll({
            attributes: ['id'],
            where: { sponsor: { [Op.in]: arrin } }
        });

        if (allDown.length > 0) {
            arrin = allDown.map(user => user.id);
            ret[i] = arrin;
            i++;
            // if (i > level) break;
        } else {
            arrin = [];
        }
    }
    return ret;
};



const getTeam = async (req, res) => {
    try {
        const user = req.user; // 🔹 Get authenticated user (Assuming JWT middleware is used   
         const userId = user.id;

        if (!userId || !userId) {
            return res.status(200).json({ error: "Unauthorized: User not found" });
        }
        const ids = await myLevelTeam(userId);
        const myLevelTeamCount = await myLevelTeamCountNew(userId);
        
        const genTeam1 = myLevelTeamCount[1] || [];
        const genTeam2 = myLevelTeamCount[2] || [];
        const genTeam3 = myLevelTeamCount[3] || [];
        const genTeam4 = myLevelTeamCount[4] || [];
        const genTeam5 = myLevelTeamCount[5] || [];
        const genTeam6 = myLevelTeamCount[6] || [];


        const notes = await User.findAll({
            where: { id: ids.length ? { [Op.in]: ids } : null },
            order: [['id', 'DESC']]
        });

        const [team1, team2, team3,team4,team5,team6] = await Promise.all([
            getUsersByIds(genTeam1),
            getUsersByIds(genTeam2),
            getUsersByIds(genTeam3),
            getUsersByIds(genTeam4),
            getUsersByIds(genTeam5),
            getUsersByIds(genTeam6)

        ]);

        const [team1Stats, team2Stats, team3Stats,team4Stats,team5Stats,team6Stats] = await Promise.all([
            getTeamStats(team1),
            getTeamStats(team2),
            getTeamStats(team3),
            getTeamStats(team4),
            getTeamStats(team5),
            getTeamStats(team6)

        ]);

        const response = {
            gen_team1Recharge: team1Stats.recharge,
            gen_team1Withdraw: team1Stats.withdraw,
            gen_team1Earning: team1Stats.earning,
            
            gen_team2Recharge: team2Stats.recharge,
            gen_team2Withdraw: team2Stats.withdraw,
            gen_team2Earning: team2Stats.earning,
            
            gen_team3Recharge: team3Stats.recharge,
            gen_team3Withdraw: team3Stats.withdraw,
            gen_team3Earning: team3Stats.earning,
            
            gen_team4Recharge: team4Stats.recharge,
            gen_team4Withdraw: team4Stats.withdraw,
            gen_team4Earning: team4Stats.earning,
            gen_team5Recharge: team5Stats.recharge,
            gen_team5Withdraw: team5Stats.withdraw,
            gen_team5Earning: team5Stats.earning,
            gen_team6Recharge: team6Stats.recharge,
            gen_team6Withdraw: team6Stats.withdraw,
            gen_team6Earning: team6Stats.earning,
            
            gen_team1total: team1.length,
            active_gen_team1total: team1.filter(u => u.active_status === 'Active').length,
            gen_team2total: team2.length,
            active_gen_team2total: team2.filter(u => u.active_status === 'Active').length,
            gen_team3total: team3.length,
            active_gen_team3total: team3.filter(u => u.active_status === 'Active').length,
            gen_team4total: team4.length,
            active_gen_team4total: team4.filter(u => u.active_status === 'Active').length,
            gen_team5total: team5.length,
            active_gen_team5total: team5.filter(u => u.active_status === 'Active').length,
            todaysUser: notes.filter(u => u.jdate === new Date().toISOString().split('T')[0]).length,
            totalTeam: notes.length,
            ActivetotalTeam: notes.filter(u => u.active_status === 'Active').length,
            totalLevelIncome: await Income.sum('comm', { where: { user_id: userId, remarks: 'Team Bonus' } }),
            balance: parseFloat(0)
        };
         res.status(200).json({
            message: 'Fetch successfully',
            status: true,
            data: response
        });

    } catch (error) {
        console.error(error);
        res.status(200).json({
            message: 'Server error',
            status: false,
        });
    }
};


const listUsers = async (req, res) => {
  try {
    const { selected_level, limit = 10, page = 1, search } = req.query;
    const user = req.user;

    const myLevelTeam = await myLevelTeamCount2(user.id);

    let genTeam = {};
    if (selected_level > 0) {
      genTeam = myLevelTeam[selected_level] || [];
    } else {
      genTeam = myLevelTeam;
    }

    let whereCondition = { [Op.or]: [] };

    if (Object.keys(genTeam).length > 0) {
      Object.values(genTeam).forEach((value) => {
        if (Array.isArray(value)) {
          whereCondition[Op.or].push({ id: { [Op.in]: value } });
        } else {
          whereCondition[Op.or].push({ id: value });
        }
      });
    } else {
      whereCondition = { id: null };
    }

    if (search && req.query.reset !== "Reset") {
      whereCondition[Op.or].push(
        { name: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { jdate: { [Op.like]: `%${search}%` } },
        { active_status: { [Op.like]: `%${search}%` } }
      );
    }

    const users = await User.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      attributes: [
        "id",
        "username",
        "name",
        "email",
        "phone",
        "active_status",
        "jdate",
        "adate",
        "userbalance",
        "package",
        "created_at",
        [
          fn(
            "COALESCE",
            literal(`(
              SELECT SUM(amount)
              FROM withdraws
              WHERE withdraws.user_id = User.id
              AND withdraws.status = 'Approved'
            )`),
            0
          ),
          "total_withdrawal"
        ],
        [
          fn(
            "COALESCE",
            literal(`(
              SELECT CONCAT(name, ' (', username, ')')
              FROM users
              WHERE users.id = User.sponsor
            )`),
            "N/A"
          ),
          "sponsor_info"
        ]
      ]
    });

    // ⬇️ Fetch and attach VIP level
    const usersWithVip = await Promise.all(users.map(async (usr) => {
      const vipRank = await getVip(usr.id);
      return {
        ...usr.get({ plain: true }),
        vip_rank: vipRank
      };
    }));

    const total = await User.count({
      where: whereCondition,
      distinct: true
    });

    return res.status(200).json({
      direct_team: usersWithVip,
      search,
      page,
      total,
      limit,
      status: true
    });

  } catch (error) {
    console.error("❌ Error fetching user list:", error.message);
    console.error(error.stack);
    return res.status(500).json({ message: "Internal Server Error", status: false });
  }
};


const totalTeam = async (req, res) => {
  try {
    const { status, limit = 10, page = 1, search } = req.query;
    const user = req.user;
    const userId = user.id;

    const myLevelTeam = await myLevelTeamCount2_new(userId);
    let genTeam = myLevelTeam || {};

    // ✅ Start building dynamic where condition
    let whereCondition = { [Op.and]: [] };

    // ✅ Add team filter (id in downline)
    if (Object.keys(genTeam).length > 0) {
      const ids = Object.values(genTeam).flat();
      whereCondition[Op.and].push({ id: { [Op.in]: ids } });
    } else {
      whereCondition[Op.and].push({ id: null }); // no team, return empty
    }

    // ✅ Add status filter if applicable
    if (status === "Active") {
      whereCondition[Op.and].push({ active_status: "Active" });
    }

    // ✅ Add search filters
    if (search && req.query.reset !== "Reset") {
      whereCondition[Op.and].push({
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { username: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { jdate: { [Op.like]: `%${search}%` } },
          { active_status: { [Op.like]: `%${search}%` } }
        ]
      });
    }

    // ✅ Fetch paginated users
    const users = await User.findAll({
      where: whereCondition,
      order: [["id", "DESC"]],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      attributes: [
        "id",
        "username",
        "name",
        "email",
        "phone",
        "active_status",
        "jdate",
         "adate",
        "userbalance",
        "package",
        "created_at",
        // Total withdrawals
        [
          fn(
            "COALESCE",
            literal(`(
              SELECT SUM(amount)
              FROM withdraws
              WHERE withdraws.user_id = User.id
              AND withdraws.status = 'Approved'
            )`),
          0),
          "total_withdrawal"
        ],
        // Sponsor info (name and username)
        [
          fn(
            "COALESCE",
            literal(`(
              SELECT CONCAT(name, ' (', username, ')')
              FROM users
              WHERE users.id = User.sponsor
            )`),
          "N/A"),
          "sponsor_info"
        ]
      ]
    });
    
       // ⬇️ Fetch and attach VIP level
    const usersWithVip = await Promise.all(users.map(async (usr) => {
      const vipRank = await getVip(usr.id);
      return {
        ...usr.get({ plain: true }),
        vip_rank: vipRank
      };
    }));
    

    // ✅ Count total for pagination
    const total = await User.count({
      where: whereCondition,
      distinct: true
    });

    // ✅ Send response
    return res.status(200).json({
      direct_team: usersWithVip,
      search,
      page: parseInt(page),
      total,
      limit: parseInt(limit),
      status: true
    });

  } catch (error) {
    console.error("❌ Error fetching user list:", error.message);
    console.error(error.stack);
    return res.status(500).json({
      message: "Internal Server Error",
      status: false
    });
  }
};



module.exports = { getTeam ,listUsers,totalTeam};
